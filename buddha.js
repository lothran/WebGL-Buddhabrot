

function Buddha(gl)
{
    this.gl= gl;
    this.orbitSampleBegin = [-3,-2];
    this.orbitSampleEnd = [2,2];
    this.importanceResolution = 500;
    this.orbitCount = 100000;
    this.viewMatrix =   [1,0,0,
                        0,1,0,
                        0,0,1];
    this.iterationCount = 100;                    

    this.rng  = new MersenneTwister();
    this.importanceMapRender = new FullscreenQuad(gl,null,buddhaImportanceFs);

    this.createOrbitData();
    this.createOrbitFB();
    this.createImportanceFB();
    this.orbitData.refreshSeeds();
    this.genOrbitsTF = gl.createTransformFeedback();
    this.traceOrbitsSHP = twgl.createProgramInfo(gl,[buddhaTraceOrbitsVs,buddhaTraceOrbitsFs],{transformFeedbackVaryings:["nextOrbitPosition"]});
    this.traceOrbitsIterLoc = gl.getUniformLocation( this.traceOrbitsSHP.program,"iteration");
    this.genOrbitsSHP =  twgl.createProgramInfo(gl,[buddhaGenOrbitsVs,buddhaGenOrbitsFs],{transformFeedbackVaryings:["nextOrbitSource","nextOrbitPosition","nextSeed"],});
    this.display = new TexturQuad(gl,this.orbitFB.attachments[0]);
    this.updateImportanceMap();
    this.genOrbits();

}
Buddha.prototype = {
    createImportanceFB: function()
    {
        var size = math.multiply( math.subtract(this.orbitSampleEnd ,this.orbitSampleBegin),this.importanceResolution);
        const gl = this.gl;
        const importanceAttachments = [
            {internalFormat:gl.R8, format: gl.RED,type:gl.UNSIGNED_BYTE}
        ]
        this.importanceFB =twgl.createFramebufferInfo(gl,importanceAttachments);
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

        }
        this.importanceMapRender.draw(importanceUniforms);
        twgl.bindFramebufferInfo(gl);
    },

    show:function()
    {
        this.display.draw();
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
            this.orbitData.swapPosition();
        }
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
            orbitData.destroy();
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