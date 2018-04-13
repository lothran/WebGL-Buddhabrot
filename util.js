function FullscreenQuad(gl,vs,fs)
{
    const vertexData = 
    {
        position: new Float32Array([-1, -1, 0, 
                                    1, -1, 0, 
                                    1, 1, 0, 
                                    -1, 1, 0]),
        texcoord: new Float32Array([0, 0, 
                                    1, 0, 
                                    1, 1, 
                                    0, 1]),
    }
    if(vs == null)
    {
        vs = `#version 300 es
        precision highp float;
        precision highp int;
        in vec3 position;
        in vec2 texcoord;
        out vec2 uv;
        void main()
        {
            gl_Position = vec4(position,1);
            uv = texcoord;
        }`

    }
    if(fs == null)
    {
        fs = `#version 300 es
        precision highp float;
        precision highp int;
        out vec4 color;
        in vec2 uv;
        void main()
        {
            color = vec4(uv,1,1);

        }`

    }
   
    const vertexBuffer = twgl.createBufferInfoFromArrays(gl,vertexData);
   
    
    const shp = twgl.createProgramInfo(gl,[vs,fs]);
    this.draw = function(uniforms)
    {
       
        gl.useProgram(shp.program);
        
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        twgl.setUniforms(shp,uniforms)
        twgl.setBuffersAndAttributes(gl,shp,vertexBuffer);
        gl.drawArrays(gl.TRIANGLE_FAN,0,4);
       
    }
}
function Mandelbrot(gl)
{
    this.uniforms = 
    {
        viewMatrix: [1,0,0,
                    0,1,0,
                    0,0,1],
        ccolor:[0.5,0.085,0.085],

    };
    const fs = 
    `#version 300 es
    precision highp float;
    precision highp int;
    uniform mat3 viewMatrix;
    uniform vec3 ccolor;
    out vec4 color;
    in vec2 uv;
    vec2 cpow2(vec2 z)
    {
        return vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y);

    }
    bool isInM()
    {
        vec2 p = uv*2.0-vec2(1);
        p = ( inverse(viewMatrix)*vec3(p,1)).xy;
        vec2 z = p;
        for(int i = 0;i<100;i++)
        {
            z = cpow2(z)+p;
            if(dot(z,z)>4.0)
            {
                return false;
            }

        }
        return true;

    }
    void main()
    {
        if(isInM())
        {
            color = vec4(ccolor,1);
        }
        else
        {
            color = vec4(0,0,0,1);

        }
    }`
    var quad =  new FullscreenQuad(gl,null,fs);
   
    
    this.draw = function(){quad.draw(this.uniforms);};

}
function TexturQuad(gl,tex)
{
    this.uniforms =
    {
        image: tex,
    }
    const fs = `#version 300 es
    precision highp float;
    precision highp int;
    out vec4 color;
    uniform sampler2D image;
    in vec2 uv;
    void main()
    {
        color = vec4(sqrt(texture(image,uv).rgb)/100.0,1);

    }`
    var quad =  new FullscreenQuad(gl,null,fs);
    this.draw = function(){quad.draw(this.uniforms);};
}

function ViewMatrix2D(center,zoom,rotation,target)
{
    var ratio = target.width/target.height;
    var matT = matT =[[1,0,0],[0,1,0],[center[0],center[1],1]];
    var matS = [[Math.pow(2,zoom),0,0],[0,Math.pow(2,zoom)*ratio,0],[0,0,1]];
    rotation = math.round(rotation,10);//Fix nasty error with 1/2 PI;
    matR = [[Math.cos(rotation),Math.sin(rotation),0],[-Math.sin(rotation),Math.cos(rotation),0],[0,0,1]];
    var zoomSpeed = 0;
    var moveSpeed  = [0,0];
    var inRotation = false;
    var inDarg = false;
    var mat = math.multiply(matR,math.multiply(matT,matS));
    var dirty= false;
    target.onwheel = function(e)
    {
        
        zoomSpeed += e.deltaY*0.001;
         dirty = true;
    }
    target.onmousedown =function(e)
    {
        

        if(e.button == 0)
        {
            if(inDarg ==false){
    
                inDarg = true;
             dirty = true;
            }

        }
        if(e.button == 1)
        {
            if(!inRotation){
                inRotation = true;
                 dirty = true;
            }
        }

    }
    target.onmousemove = function(e)
    {
        if(inDarg)
        {
            
            moveSpeed[0]+= e.movementX/target.width*0.2*Math.pow(2,-zoom);
            moveSpeed[1] +=e.movementY/target.height*0.2*Math.pow(2,-zoom);
            dirty = true;
        }

    }
    target.onmouseup = function(e)
    {
        if(e.button == 0)
        {
            inDarg = false;
        }
        if(e.button == 1)
        {
           
            inRotation = false;
            
        }
    }
    this.isDirty = function(){return dirty;}
    this.getMatrix =function(deltaT)
    {
        var changed = false;
        if(Math.abs(zoomSpeed)>0.0001)
        {
            zoom += zoomSpeed;
            matS = [[Math.pow(2,zoom),0,0],[0,Math.pow(2,zoom)*ratio,0],[0,0,1]];
            zoomSpeed *= 0.9;
            
            changed = true;
        }
        if( inRotation)
        {   
            rotation += Math.PI/(24*16);
            changed =true;
            matR = [[Math.cos(rotation),Math.sin(rotation),0],[-Math.sin(rotation),Math.cos(rotation),0],[0,0,1]];
            matR =math.round(matR,3);
        }
       
        
        if(Math.abs(moveSpeed[0]) >0.0001 || Math.abs(moveSpeed[1])>0.001)
        {

            
            center[0] += moveSpeed[0];
            center[1] -= moveSpeed[1];
            moveSpeed[0] *= 0.9;
            moveSpeed[1] *= 0.9;
            matT = matT =[[1,0,0],[0,1,0],[center[0],center[1],1]];
            changed = true; 
                   
        }
        if(changed)
        {
            mat  =math.multiply(matR,math.multiply(matT,matS));
        }
        else
        {
            dirty = false;
            
        }
        return  [].concat.apply([], mat);

    }

}


