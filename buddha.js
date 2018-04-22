





var BuddhaCount = 0;
function Buddha(gl)
{
    this.gl= gl;
    this.orbitSampleBegin = [-2.2,-1.1];
    this.orbitSampleEnd = [0.5,1.1];
    this.importanceResolution = 1200;
    this.orbitCount = 2000;
    this.viewMatrix = [1,0,0,
                        0,1,0,
                        0,0,1];

                        
    this.importanceSampleCount =20;
    this.iterationCount = (1000+(Math.random()-0.5)*600)/((BuddhaCount+1));      
    this.sqrtNormalize = false;
    this.showImportanceMap = false;
    if(BuddhaCount%3 == 0)
    {
        this.outputColor = [255,0,0,1];
    }
    if(BuddhaCount%3 == 1)
    {
        this.outputColor = [0,255,0,1];
    }

    if(BuddhaCount%3 == 2)
    {
        this.outputColor = [0,0,255,1];
    }

   
    this.rng  = new MersenneTwister();
    this.importanceMapRender = new FullscreenQuad(gl,null,buddhaImportanceFs);
    this.createOrbitData();
    this.createOrbitFB();
    this.createImportanceFB();
    this.orbitData.refreshSeeds();
    this.genOrbitsTF = gl.createTransformFeedback();
    this.traceOrbitsSHP = twgl.createProgramInfo(gl,[buddhaTraceOrbitsVs,buddhaTraceOrbitsFs],{transformFeedbackVaryings:["nextOrbitPosition"]});
    this.traceOrbitsIterLoc = gl.getUniformLocation( this.traceOrbitsSHP.program,"iteration");
    this.traceOrbitsMirrorLoc = gl.getUniformLocation( this.traceOrbitsSHP.program,"mirror");
    this.genOrbitsSHP =  twgl.createProgramInfo(gl,[buddhaGenOrbitsVs,buddhaGenOrbitsFs],{transformFeedbackVaryings:["nextOrbitSource","nextOrbitPosition","nextSeed"],});
    this.updateImportanceMap();
    this.genOrbits();
    this.drawMirrored = true;
    var group = gui.addFolder("Buddha"+BuddhaCount.toString());
    var iterationCon = group.add(this,"iterationCount",1,800);
    var orbitCountCon = group.add(this,"orbitCount",200,50000);
    var importanceSampleCountCon  = group.add(this,"importanceSampleCount",1,100);
    var outputColorCon = group.addColor(this,"outputColor");
    var mirrorCon = group.add(this,"drawMirrored");
    var sqrtNormalizeCon= group.add(this,"sqrtNormalize");
    var showImportanceMapCon= group.add(this,"showImportanceMap");
    var importanceResolutionCon = group.add(this,"importanceResolution",50,2500);
    importanceResolutionCon.onChange(()=>
    {   
        this.createImportanceFB();
        this.reset();
    });
    importanceSampleCountCon.onChange(()=>{this.reset()});
    outputColorCon.onChange(()=>
    {   
        
        this.reset();
    });
    importanceSampleCountCon .onChange(()=>
    {   
        this.reset();
    });
    orbitCountCon.onChange(()=>
    {   
        this.createOrbitData();
        this.reset();
    });
    iterationCon.onChange(()=>
    {   
        this.reset();
    });
    const displayFs = `
    #version 300 es
    precision highp float;
    precision highp int;
    out vec4 result;
    uniform sampler2D density;
    uniform sampler2D maxTex;
    uniform bool sqrtNormalize;
    uniform bool showImportanceMap;
    uniform vec4 color;
    uniform vec2 renderSize;
    in vec2 uv;



    float sampleDensity(vec2 p)
    {
        return texture(density,p).r;
    }
    float maxDensity()
    {
        return texelFetch(maxTex,ivec2(0),0).r;
    }


    void main()
    {
        if(showImportanceMap)
        {
            result = vec4(vec3(texture(density,uv).r),1);
            return;
        }
        float d =  sqrt( sampleDensity(uv))/sqrt(maxDensity());
   
        result = vec4(color.rgb*d,color.a);

    }`; 
    this.normalizer = new MaxTexture(gl,gl.drawingBufferWidth,gl.drawingBufferHeight);
    this.displayQuad = new FullscreenQuad(gl,null,displayFs);
    BuddhaCount++;
    
}
Buddha.prototype = {


    draw: function()
    {
        const gl = this.gl;
        
        this.normalizer.update(this.orbitFB.attachments[0]);
        var drawUniforms = 
        {
            maxTex: this.normalizer.tex(),
            color: math.multiply( 1.0/255.0,this.outputColor),
            density: this.orbitFB.attachments[0],
            sqrtNormalize: this.sqrtNormalize,
            showImportanceMap:this.showImportanceMap,
            renderSize:[gl.drawingBufferWidth,gl.drawingBufferHeight],
        }
        if(this.showImportanceMap)
        {
            drawUniforms.density = this.importanceFB.attachments[0];
        }
          
        drawUniforms.color[3] = this.outputColor[3];
    

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        this.displayQuad.draw(drawUniforms);
        gl.disable(gl.BLEND);
        this.normalizeCounter++;
    },
    reset: function()
    {
        this.updateImportanceMap();
        this.clearOrbitsMap();

    },
    createImportanceFB: function()
    {
        const gl = this.gl;
        var size = math.multiply( math.subtract(this.orbitSampleEnd ,this.orbitSampleBegin),this.importanceResolution);
        const importanceAttachments = [
            {internalFormat:gl.R8, format: gl.RED,type:gl.UNSIGNED_BYTE}
        ]
        this.importanceFB =twgl.createFramebufferInfo(gl,importanceAttachments,size[0],size[1]);
        twgl.bindFramebufferInfo(gl);
    },

    updateImportanceMap: function()
    {
        const gl = this.gl; 
        twgl.bindFramebufferInfo(gl, this.importanceFB);
        const importanceUniforms = 
        {
            orbitSampleBegin:this.orbitSampleBegin,
            orbitSampleEnd:this.orbitSampleEnd,
            iterationCount: this.iterationCount,
            viewMatrix: this.viewMatrix,
        }
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.importanceMapRender.draw(importanceUniforms);
        twgl.bindFramebufferInfo(gl);
    },

    traceOrbits: function()
    {  
        const gl = this.gl; 
        twgl.bindFramebufferInfo(gl,this.orbitFB);
        gl.useProgram(this.traceOrbitsSHP.program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        var traceOrbitsUniforms  =
        {
            orbitSampleBegin:this.orbitSampleBegin,
            orbitSampleEnd:this.orbitSampleEnd,
            viewMatrix: this.viewMatrix,

        }
        twgl.setUniforms(this.traceOrbitsSHP,traceOrbitsUniforms);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
   
        
        for(var i = 0;i<this.iterationCount;i++){
            gl.uniform1f(this.traceOrbitsIterLoc ,i);
            gl.bindBuffer(gl.ARRAY_BUFFER,this.orbitData.orbitPosition0);
            gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
            gl.bindBuffer(gl.ARRAY_BUFFER,this.orbitData.orbitSource0);
            gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,this.orbitData.orbitPosition1);
            gl.beginTransformFeedback(gl.POINTS);
            gl.drawArrays(gl.POINTS,0,this.orbitCount);
            gl.endTransformFeedback(gl.POINTS);
            if(this.drawMirrored)
            {
                gl.uniform1i(this.traceOrbitsMirrorLoc,1);
                gl.drawArrays(gl.POINTS,0,this.orbitCount);
                gl.uniform1i(this.traceOrbitsMirrorLoc,0);
            }
            this.orbitData.swapPosition();
        }
        gl.disable(gl.BLEND);
        twgl.bindFramebufferInfo(gl,0); 
    },

    genOrbits: function()
    {
        const gl = this.gl;
        var genOrbitsUniforms =
        {
            orbitSampleBegin:this.orbitSampleBegin,
            orbitSampleEnd:this.orbitSampleEnd,
            iterationCount: this.iterationCount,
            importanceMap: this.importanceFB.attachments[0],
            viewMatrix: this.viewMatrix,

        };
        gl.useProgram(this.genOrbitsSHP.program);
        twgl.setUniforms(this.genOrbitsSHP,genOrbitsUniforms)
        gl.enable(gl.RASTERIZER_DISCARD);
    
        this.bindArrayBuffer(this.orbitData.seed0,0,gl.UNSIGNED_INT,1);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.genOrbitsTF);
        this.bindTFBuffer(this.orbitData.orbitPosition1,1);
        this.bindTFBuffer(this.orbitData.seed1,2);
        this.bindTFBuffer(this.orbitData.orbitSource1,0);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS,0,this.orbitCount);
        gl.endTransformFeedback(gl.POINTS);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);
        gl.disable(gl.RASTERIZER_DISCARD);
        this.orbitData.swapSeeds();
        this.orbitData.swapPosition();
        this.orbitData.swapSource();
    },
    clearOrbitsMap:function()
    {
        const gl = this.gl; 
        twgl.bindFramebufferInfo(gl,this.orbitFB);
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        twgl.bindFramebufferInfo(gl);

    },
    fillRandom: function(arr)
    {
       
        for(var i = 0;i<arr.length;i++)
        {   
            arr[i] = this.rng.int();
        }
        return arr;
    },
    createOrbitData: function()
    {
        const gl = this.gl;
        var buddha =  this;
        if(this.orbitData)
        {
            this.orbitData.destroy();
        }
        this.orbitData = {
            seed0:this.createBuffer(this.fillRandom(new Uint32Array(this.orbitCount))),
            seed1:this.createBuffer(this.orbitCount*4),
            swapSeeds:function()
            {
                var t = this.seed0;
                this.seed0 = this.seed1;
                this.seed1 = t;
            },
            orbitSource0:this.createBuffer(this.orbitCount*4*2),
            orbitSource1:this.createBuffer(this.orbitCount*4*2),
            swapSource:function()
            {
                var t = this. orbitSource0;
                this. orbitSource0 = this.orbitSource1;
                this. orbitSource1 = t;
            },
            orbitPosition0:this.createBuffer(this.orbitCount*4*2),
            orbitPosition1:this.createBuffer(this.orbitCount*4*2),
            swapPosition:function()
            {
                var t = this. orbitPosition0;
                this.orbitPosition0 = this.orbitPosition1;
                this.orbitPosition1 = t;
            },
            refreshSeeds:function()
            {   
                gl.deleteBuffer(this.seed0);
                
                this.seed0 = buddha.createBuffer(buddha.fillRandom(new Uint32Array(buddha.orbitCount)));
            },
            destroy:function()
            {
                gl.deleteBuffer(this.seed0);
                gl.deleteBuffer(this.seed1);
                gl.deleteBuffer(this.orbitPosition0);
                gl.deleteBuffer(this.orbitPosition1);
                gl.deleteBuffer(this.orbitSource0);
                gl.deleteBuffer(this.orbitSource1);
            }
    
        };

    },
 

    createOrbitFB: function()
    {
        const gl = this.gl;
        const orbitAttachments = [
            {internalFormat:gl.R32F, format: gl.RED,type:gl.FLOAT}
        ]
        this.orbitFB =twgl.createFramebufferInfo(gl,orbitAttachments);
        twgl.bindFramebufferInfo(gl);
        
    },
    createBuffer: function(data)
    {
        const gl = this.gl;
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
        return b;
    },
    bindArrayBuffer:function(buffer,index,type,numC)
    {
        const gl = this.gl;
        gl.enableVertexAttribArray(index);
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        if(type == gl.UNSIGNED_INT||type == gl.INT)
        {
            gl.vertexAttribIPointer(index,numC,type,0,0);
        }
        else
        {
            gl.vertexAttribPointer(index,numC,type,false,0,0);

        }
    },
    bindTFBuffer: function(buffer,index)
    {
        const gl = this.gl;
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,index,buffer);
    }


};