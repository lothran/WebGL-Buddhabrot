













/*


function Buddha(gl)
{
   



    var orbitUniforms = 
    {
        viewMatrix: [1,0,0,
            0,1,0,
            0,0,1],
    };
    var importanceUniforms = 
    {
        orbitSampleBegin:[-3,-2],
        orbitSampleEnd:[2,2],
    }
    var importanceMapResolution = 100;
    var importanceMapSize  =[0,0];
    var importanceFB  = {};
    this.createImportanceMap =function()
    {
        const importanceAttachments = [
            {internalFormat:gl.R8, format: gl.RED}
        ]
        importanceMapSize[0] = (importanceUniforms.orbitSampleEnd[0]-importanceUniforms.orbitSampleBegin[0])*importanceMapResolution;
        importanceMapSize[1] = (importanceUniforms.orbitSampleEnd[1]-importanceUniforms.orbitSampleBegin[1])*importanceMapResolution;
        console.log(importanceMapSize);
        importanceFB = twgl.createFramebufferInfo(gl,importanceAttachments,importanceMapSize[0],importanceMapSize[1]);
        twgl.bindFramebufferInfo(gl);
    }
    this.createImportanceMap();
    var importanceRender = new FullscreenQuad(gl,null,buddhaImportanceFs);
    this.updateImportanceMap = function()
    {
        twgl.bindFramebufferInfo(gl,importanceFB);
        importanceRender.draw( importanceUniforms );
        twgl.bindFramebufferInfo(gl);
    }
    this.updateImportanceMap();

  
    

    var orbitFB = {};
    this.createOrbitMap =function()
    {
        const orbitAttachments = [
            {internalFormat:gl.RGBA16F, format: gl.RGAB,type:gl.HALF_FLOAT}
        ]
        orbitFB =twgl.createFramebufferInfo(gl,orbitAttachments);
        twgl.bindFramebufferInfo(gl);
    }
    this.createOrbitMap();
    var orbitCount  = 200000;

    function fillRandom(arr)
    {
        var rng = new MersenneTwister();
        for(var i = 0;i<arr.length;i++)
        {   
            arr[i] = rng.int();
        }
        return arr;
    }
    function createBuffer(data)
    {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
        return b;
    } 

    
    
    var orbitData =
    {   
   
        seed0:createBuffer(fillRandom(new Uint32Array(orbitCount))),
        seed1:createBuffer(orbitCount*4),
        swapSeeds:function()
        {
            var t = this.seed0;
            this.seed0 = this.seed1;
            this.seed1 = t;
        },
        orbitSource0:createBuffer(orbitCount*4*2),
        orbitSource1:createBuffer(orbitCount*4*2),
        swapSource:function()
        {
            var t = this. orbitSource0;
            this. orbitSource0 = this. orbitSource1;
            this. orbitSource1 = t;
        },
        orbitPosition0:createBuffer(orbitCount*4*2),
        orbitPosition1:createBuffer(orbitCount*4*2),
        swapPosition:function()
        {
            var t = this. orbitPosition0;
            this.orbitPosition0 = this.orbitPosition1;
            this.orbitPosition1 = t;
        },

    }
 
    var genOrbitsSHP = twgl.createProgramInfo(gl,[buddhaGenOrbitsVs,buddhaGenOrbitsFs],{transformFeedbackVaryings:["nextOrbitSource","nextOrbitPosition","nextSeed"],});
    
    var t1 = gl.createTransformFeedback();
    console.log(gl.getTransformFeedbackVarying(genOrbitsSHP.program,0));
    console.log(gl.getTransformFeedbackVarying(genOrbitsSHP.program,1));
    console.log(gl.getTransformFeedbackVarying(genOrbitsSHP.program,2));
    function genOrbits(){

        gl.useProgram(genOrbitsSHP.program);
        twgl.setUniforms(genOrbitsSHP,importanceUniforms)
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.enableVertexAttribArray(0)
        gl.bindBuffer(gl.ARRAY_BUFFER,orbitData.seed0);
        gl.vertexAttribIPointer(0,1,gl.UNSIGNED_INT,0,0);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,t1);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,1,orbitData.orbitPosition1);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,2,orbitData.seed1);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,orbitData.orbitSource1);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS,0,orbitCount);
        gl.endTransformFeedback(gl.POINTS);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);
        gl.disable(gl.RASTERIZER_DISCARD);
        orbitData.swapSeeds();
        orbitData.swapPosition();
        orbitData.swapSource();
    }

    var traceOrbitsSHP = twgl.createProgramInfo(gl,[buddhaTraceOrbitsVs,buddhaTraceOrbitsFs],{transformFeedbackVaryings:["nextOrbitPosition"]});

    this.setViewMat = function(mat)
    {
        orbitUniforms.viewMatrix = mat;
    }
    function traceOrbits()
    {
    
        gl.useProgram(traceOrbitsSHP.program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        twgl.setUniforms(traceOrbitsSHP,orbitUniforms);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        for(var i = 0;i<100;i++){
        gl.bindBuffer(gl.ARRAY_BUFFER,orbitData.orbitPosition0);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER,orbitData.orbitSource0);
        gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,orbitData.orbitPosition1);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS,0,orbitCount);
        gl.endTransformFeedback(gl.POINTS);
        orbitData.swapPosition();
        }
    }

   
    var display = new TexturQuad(gl,orbitFB.attachments[0]);
    function render()
    {   
       
        twgl.bindFramebufferInfo(gl,orbitFB); 
        genOrbits();
        traceOrbits();
        twgl.bindFramebufferInfo(gl,null);
        display.draw(); 
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    
 

}
 */

function Buddha(gl)
{
    this.gl= gl;
    this.orbitSampleBegin = [-3,-2];
    this.orbitSampleEnd = [2,2];
    this.orbitCount = 100000;
    this.viewMatrix =   [1,0,0,
                        0,1,0,
                        0,0,1];
    this.rng  = new MersenneTwister();
   
    this.createOrbitData();
    this.createOrbitFB();
    this.orbitData.refreshSeeds();
    this.genOrbitsTF = gl.createTransformFeedback();
    this.traceOrbitsSHP = twgl.createProgramInfo(gl,[buddhaTraceOrbitsVs,buddhaTraceOrbitsFs],{transformFeedbackVaryings:["nextOrbitPosition"]});
    this.genOrbitsSHP =  twgl.createProgramInfo(gl,[buddhaGenOrbitsVs,buddhaGenOrbitsFs],{transformFeedbackVaryings:["nextOrbitSource","nextOrbitPosition","nextSeed"],});
    this.display = new TexturQuad(gl,this.orbitFB.attachments[0]);
    this.genOrbits();

}
Buddha.prototype = {

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
        
        for(var i = 0;i<100;i++){
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
            {internalFormat:gl.RGBA16F, format: gl.RGAB,type:gl.HALF_FLOAT}
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