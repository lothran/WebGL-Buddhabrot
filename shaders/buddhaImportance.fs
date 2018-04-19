const buddhaImportanceFs = 
`#version 300 es
    precision lowp float;
    precision lowp int;

    uniform vec2 orbitSampleBegin;
    uniform vec2 orbitSampleEnd;
    uniform int iterationCount;
    uniform mat3 viewMatrix;
    out float result;
    in vec2 uv;
    vec2 cpow2(vec2 z)
    {
        return vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y);

    }
    float budhhaImportance()
    {
        vec2 p = uv*(orbitSampleEnd-orbitSampleBegin)+orbitSampleBegin;
        vec2 z = p;
        bool valid = false;
        float fitness = 0.0;
        
        for(int i;i<iterationCount;i++)
        {
            

            z = cpow2(z)+p;
            vec2 k = (viewMatrix*vec3(z,1)).xy;
            if(abs(k.x)<1.0 && abs(k.y)<1.0)
            {
                fitness++;
            }

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
            return sqrt(fitness)/sqrt(float(iterationCount));
        }
        else
        {
            return 0.0;
        }

    }
    void main()
    {
        result = budhhaImportance();
    }
    
    `;