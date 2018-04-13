





function main()
{

    var canvas= document.getElementById("glcanvas");
    var gl = canvas.getContext("webgl2");
 
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ex = gl.getExtension('EXT_color_buffer_float');
    var ex1 =     gl.getExtension('OES_texture_float_linear');
      


 
    var mat = new ViewMatrix2D([0,0],-2,-Math.PI/2,canvas);

    var b = new Buddha(gl);
    var m = new Mandelbrot(gl);
    b.viewMatrix = mat.getMatrix(1);
    b.traceOrbits();
    b.show();
    var inMove =false;
    function render()
    {
      
        
        b.viewMatrix = mat.getMatrix(1);
      
        if(mat.isDirty())
        {
            m.draw();
            m.uniforms.viewMatrix = b.viewMatrix;
            inMove = true;

        }
        else
        {
            if(inMove)
            {
                b.clearOrbitsMap();
                inMove =false;

            }
            b.genOrbits();
            b.traceOrbits();
            b.show();
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

main();

