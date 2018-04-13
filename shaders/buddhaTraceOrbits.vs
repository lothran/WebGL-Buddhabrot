const buddhaTraceOrbitsVs = `
#version 300 es
precision highp float;
precision highp int;
layout(location = 0)in vec2 orbitPosition;
layout(location = 1)in vec2 orbitSource;

uniform mat3 viewMatrix;
uniform vec2 orbitSampleBegin;
uniform vec2 orbitSampleEnd;
uniform float iteration;


out vec2 nextOrbitPosition;


vec2 cpow2(vec2 z)
{
    return vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y);
}


void main()
{
   
  
       
        if(orbitPosition.x == 0.0&&orbitPosition.y == 0.0)
        {
            nextOrbitPosition.x = 0.0;
            nextOrbitPosition.y = 0.0;
            gl_Position = vec4(10000,10000,0,1);
            gl_PointSize = 0.0;
        }
        else if(dot(orbitPosition,orbitPosition)>40.0)
        {
            nextOrbitPosition.x = 0.0;
            nextOrbitPosition.y = 0.0;
            gl_Position = vec4(10000,10000,0,1);
            gl_PointSize = 0.0;
        }
        else{
             gl_PointSize = 1.0;
            nextOrbitPosition = cpow2(orbitPosition)+orbitSource;
            gl_Position = vec4( (viewMatrix*vec3(nextOrbitPosition,1)).xy ,0,1);
        }
    
   

}`;