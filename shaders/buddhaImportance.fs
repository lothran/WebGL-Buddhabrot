const buddhaImportanceFs = 
`#version 300 es
    precision lowp float;
    precision lowp int;

    uniform vec2 orbitSampleBegin;
    uniform vec2 orbitSampleEnd;

    out float result;
    in vec2 uv;
    vec2 cpow2(vec2 z)
    {
        return vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y);

    }
    float budhhaImportanc()
    {
        vec2 p = uv*(orbitSampleEnd-orbitSampleBegin)+orbitSampleBegin;
        vec2 z = p;
        bool valid = false;
        int i  = 0;
        for(;i<100;i++)
        {
            z = cpow2(z)+p;
            float d =dot(z,z);
            if(d>4.0)
            {
                valid = true;
            }
            if(d >12.0)
            {
                break;
            }
        }
        if(valid){
            return sqrt(float(i))/sqrt(100.);
        }
        else
        {
            return .0;
        }

    }
    void main()
    {
        result = budhhaImportanc();
    }
    
    `;