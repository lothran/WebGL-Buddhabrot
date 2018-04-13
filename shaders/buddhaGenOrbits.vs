const buddhaGenOrbitsVs = `
#version 300 es
precision highp float;
precision highp int;
layout(location =0)in uint seed; 
uint lseed;
out vec2 nextOrbitSource;
out vec2 nextOrbitPosition;
flat out uint nextSeed;
uniform vec2 orbitSampleBegin;
uniform vec2 orbitSampleEnd;
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
    for(int i = 0;i<200;i++)
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

    for(int i = 0;i<20;i++)
    {   
        vec2 p =rand2()*(orbitSampleEnd-orbitSampleBegin)+orbitSampleBegin;
        if( isNotInM(p))
        {
            return p;
        }
    }
}

void main()
{
    lseed  = seed;
    gl_PointSize = 1.0;
    gl_Position = vec4(pointOusideM(),0,1);
    nextSeed =lseed;
     nextOrbitSource =  gl_Position.xy;
    nextOrbitPosition =  gl_Position.xy;
   
}`;