const buddhaGenOrbitsVs = `
#version 300 es
precision lowp float;
precision lowp int;
layout(location =0)in uint seed; 
uint lseed;
out vec2 nextOrbitSource;
out vec2 nextOrbitPosition;


flat out uint nextSeed;

uniform mat3 viewMatrix;
uniform vec2 orbitSampleBegin;
uniform vec2 orbitSampleEnd;
uniform int importanceSampleCount;
uniform uint init;
uniform sampler2D importanceMap;


float rand01()
{
    uint x = lseed;
    x ^= x << 13;
	x ^= x >> 17;
	x ^= x << 5;
    lseed = x;
    return float(x)*(1.0/4294967295.0);
}
float rand11()
{
    return rand01()*2.0-1.0;
}
vec2 cpow2(vec2 z)
{
    return vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y);
}
vec2 rand2()
{
    return vec2(rand01(),rand01());
}
bool isNotInM(vec2 p)
{
  
    vec2 z = p;
    for(int i = 0;i<importanceSampleCount;i++)
    {
        z = cpow2(z)+p;
        if(dot(z,z)>4.0)
        {
            return true;
         
        } 
    }
    return false;

}

vec2 pointOusideM()
{

    vec2 bestP = vec2(0);
    float bestI = 0.0;
    for(int i = 0;i<importanceSampleCount;i++)
    {   
        vec2 uv =rand2();
        float I = texture(importanceMap,uv).r;
        if(I> bestI)
        {   
            bestP = uv*(orbitSampleEnd-orbitSampleBegin)+orbitSampleBegin;
            bestI = I;
        }
    }
    return bestP;
}

void main()
{
    lseed  = seed;
    gl_PointSize = 1.0;
    vec2 p = pointOusideM();
    gl_Position = vec4(viewMatrix*vec3(p,1),1);
    nextSeed =lseed;
     nextOrbitSource =  p;
    nextOrbitPosition =  p;
   
}`;