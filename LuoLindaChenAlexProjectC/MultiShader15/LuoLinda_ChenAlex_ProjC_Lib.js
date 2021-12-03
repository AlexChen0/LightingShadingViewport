//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.
		  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in	
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox3 
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================


//=============================================================================
//=============================================================================
var eyeX = 2;
var eyeY = 2;
var eyeZ = 0.5;
var aimZ = 0.0;
var camTheta = 79.4;
var camVel = 0.1;
var g_canvasID = document.getElementById('webgl'); 
// g_canvas.width  = document.body.clientWidth;
// g_canvas.height = document.body.clientHeight * .7;    
// function resizeCanvas(){
//   g_canvas.width  = document.body.clientWidth;
//   g_canvas.height = window.innerHeight * .7;  
// }
// g_canvas.width  = document.body.clientWidth;
// g_canvas.height = document.body.clientHeight * .7;    
// function resizeCanvas(){
//   g_canvas = document.getElementById('webgl'); 
//   var dispW = g_canvas.clientWidth;
//   var dispH = g_canvas.clientHeight* .7;
//   if(g_canvas.width != dispW || g_canvas.height != dispH){
//     g_canvas.width  = dispW;
//     g_canvas.height = dispH;  
//   }
// }
// window.addEventListener('resize', resizeCanvas, false);

function VBObox0() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
  '}\n';
  makeGroundGrid()
  var mySiz = (gndVerts.length);
  var VBO_0 = new Float32Array(mySiz);
	for(i=0; i< gndVerts.length; i++ ){// don't initialize i -- reuse it!
    VBO_0[i] = gndVerts[i];
  }
  // makeSphere()
  // var mySiz = (sphVerts.length);
  // var VBO_0 = new Float32Array(mySiz);
	// for(i=0; i< sphVerts.length; i++ ){// don't initialize i -- reuse it!
  //   VBO_0[i] = sphVerts[i];
  // }
  
  this.vboContents = VBO_0;
  this.g_modelMatrix = new Matrix4();
  this.g_modelMatrix.setIdentity();

	this.vboVerts = gndVerts.length/7;						// # of vertices held in 'vboContents' array
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts; 
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex. 

	            //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
	this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
	                              // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
	this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}
function makeGroundGrid() {
  //==============================================================================
  // Create a list of vertices that create a large grid of lines in the x,y plane
  // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
    var floatsPerVertex = 7;
    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;		
    var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
     var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
     var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
     
    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
              // draw a grid made of xcount+ycount lines; 2 vertices per line.
              
    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
    
    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
      if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
        gndVerts[j  ] = -xymax + (v  )*xgap;	// x
        gndVerts[j+1] = -xymax;								// y
        gndVerts[j+2] = 0.0;									// z
        gndVerts[j+3] = 1.0;									// w.
      }
      else {				// put odd-numbered vertices at (xnow, +xymax, 0).
        gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
        gndVerts[j+1] = xymax;								// y
        gndVerts[j+2] = 0.0;									// z
        gndVerts[j+3] = 1.0;									// w.
      }
      gndVerts[j+4] = xColr[0];			// red
      gndVerts[j+5] = xColr[1];			// grn
      gndVerts[j+6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
      if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
        gndVerts[j  ] = -xymax;								// x
        gndVerts[j+1] = -xymax + (v  )*ygap;	// y
        gndVerts[j+2] = 0.0;									// z
        gndVerts[j+3] = 1.0;									// w.
      }
      else {					// put odd-numbered vertices at (+xymax, ynow, 0).
        gndVerts[j  ] = xymax;								// x
        gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
        gndVerts[j+2] = 0.0;									// z
        gndVerts[j+3] = 1.0;									// w.
      }
      gndVerts[j+4] = yColr[0];			// red
      gndVerts[j+5] = yColr[1];			// grn
      gndVerts[j+6] = yColr[2];			// blu
    }
  }

VBObox0.prototype.init = function() {
//=============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }  
}

VBObox0.prototype.switchToMe = function() {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos0);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
  							
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }  
  // Adjust values for our uniforms,
  
  
  //useless


  //this.ModelMat.setRotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
  //this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  //gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  //										false, 				// use matrix transpose instead?
  //										this.g_modelMatrix.elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.
  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }  
  //set camera stuff
  this.g_modelMatrix.setIdentity();
  // var vpAspect = (g_canvasID.width)/g_canvasID.height;	// this camera: width/height.
  var vpAspect = (canvasW)/canvasH;
  console.log(vpAspect)
  zfar = 1000
  znear = 1
  camFOV = 30.0
  this.g_modelMatrix.perspective(camFOV,   // FOVY: top-to-bottom vertical image angle, in degrees
                        imageAspect,   // Image Aspect Ratio: camera lens width/height
                        znear,   // camera z-near distance (always positive; frustum begins at z = -znear)
                        zfar);  // camera z-far distance (always positive; frustum ends at z = -zfar)
  this.g_modelMatrix.lookAt( eyeX, eyeY, eyeZ,	// center of projection
              eyeX + Math.cos(camTheta), eyeY + Math.sin(camTheta),aimZ + eyeZ,
                      0, 0, 1);	// View UP vector. 0, 1, 0?
  this.g_modelMatrix.translate( 0.4, -0.4, 0.0);	
  this.g_modelMatrix.scale(0.1, 0.1, 0.1);	
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
                        false, 				// use matrix transpose instead?
                        this.g_modelMatrix.elements);	// send data from Javascript.                
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								0, 								// location of 1st vertex to draw;
  								this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

  function VBObox1() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!

  //HARD CODED TEST
  // lamp0.I_pos.elements.set( [6.0, 5.0, 5.0]);
  // lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  // lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  // lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);  

  // this.K_emit.push(0.0,      0.0,      0.0,      1.0);
	// 		this.K_ambi.push(0.329412, 0.223529, 0.027451, 1.0);
	// 		this.K_diff.push(0.780392, 0.568627, 0.113725, 1.0);
	// 		this.K_spec.push(0.992157, 0.941176, 0.807843, 1.0);   
	// 		this.K_shiny = 27.8974;
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    //--------------- GLSL Struct Definitions:
	'struct LampT {\n' +		// Describes one point-like Phong light source
	'		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
													//		   w==0.0 for distant light from x,y,z direction 
	' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	'		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	'}; \n' +
	//
	'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	'		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	'		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	'		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	'		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	'		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +
  //------
    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources. NEW
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials. NEW
    'uniform vec3 u_eyePosWorld; \n' + //NEW
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_blinnLighting;\n' +
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Color;\n' +
    'attribute vec3 a_Normal;\n' +
    'varying vec4 v_Color;\n' +
    'varying vec3 KD;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Position;\n' +
    'void main() {\n' +
    'v_Position = u_ModelMatrix * a_Position; \n' +
    'vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
    'v_Normal = normalize(transVec.xyz);\n' +
    'vec3 eyePos = normalize(u_eyePosWorld - v_Position.xyz); \n' +	
    'vec3 lightVec = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +	
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  float nDotL = max(dot(v_Normal, lightVec), 0.0);\n' +
    '  v_Color = vec4(0.3*a_Color + 0.7*dot(v_Normal,lightVec), 1.0);\n' +
    '  float lightTypeTerm;\n' +
    '  if(u_blinnLighting.x > 0.5){\n' + //BLINN
    '    vec3 H = normalize(lightVec + eyePos); \n' +
    '    lightTypeTerm = pow(max(dot(H, v_Normal), 0.0), float(u_MatlSet[0].shiny));\n' +
    '  }else{\n' +
    '    vec3 Rvec = normalize(reflect((-lightVec),v_Normal));\n' +		
    '    float rDotV = max(dot(Rvec, eyePos), 0.0);\n' +
    '    lightTypeTerm = pow(rDotV, float(u_MatlSet[0].shiny));\n' + //float(0);\n' +//pow(rDotV, float(u_MatlSet[0].shiny));\n' +
    // '    lightTypeTerm = 0.0;\n' +
    '  }\n' +
    '  vec3 ambient = u_LampSet[0].ambi*u_MatlSet[0].ambi;\n' +		
    '  vec3 diffuse = u_LampSet[0].diff*u_MatlSet[0].diff*nDotL;\n' +		
    '  vec3 spec = u_LampSet[0].spec*u_MatlSet[0].spec*lightTypeTerm;\n' +		
    '  v_Color = vec4(u_MatlSet[0].emit + ambient + diffuse + spec, 1.0);\n' +
    '}\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    // 'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';
    makeSphere();
    var mySiz = (sphVerts.length);
    var xu = .2;
    var yu = .25;
    var zu = .25;
    var sq2	= Math.sqrt(2.0);	
    var FishMathe = new Float32Array ([						// Array of vertex attribute values we will
                                  // transfer to GPU's vertex buffer object (VBO)
                                  0, yu, 0, 1, 					1, 0, 0, -.125, .1, 0,
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, -.125, .1, 0,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 0, -.125, .1, 0,
                                    //head triangle 2 
                                  0, yu, 0, 1, 					1, 0, 0, -.125, 0, 0.1, 
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, -.125, 0, 0.1, 
                                  xu, 0, zu, 1, 					1, 1, 1, -.125, 0, 0.1, 
                                    //head triangle 3
                                  0, yu, 0, 1, 					1, 0, 0,  -.125, -0.1, 0, 
                                  xu, 0, zu, 1, 					0, 0, 1, -.125, -0.1, 0,
                                  xu, 0, -zu, 1, 					1, 0, 1, -.125, -0.1, 0,
                                    //head triangle 4
                                  0, yu, 0, 1, 					1, 0, 0, -.125, 0, -0.1,
                                  xu, 0, -zu, 1, 					1, 1, 1, -.125, 0, -0.1,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 0, -.125, 0, -0.1,
                                    //body left side triangle 1
                                  xu, 0, zu, 1, 					1, 1, 1, 0, 0, .2, 
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, 0, 0, .2, 
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0, .2, 
                                    //body left side triangle 2
                                  xu, 0, zu, 1, 					1, 1, 1, 0, 0, .2,  
                                  3* xu, 0, zu, 1, 				1, 1, 1, 0, 0, .2, 
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0, .2, 
                                    //body right side triangle 1
                                  xu, 0, -zu, 1, 					1, 1, 1, 0, 0, -.2, 
                                  xu, 2 * yu, -zu, 1, 			1, 1, 1, 0, 0, -.2, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0, -.2, 
                                    //body right side triangle 2
                                  xu, 0, -zu, 1, 					1, 1, 1, 0, 0, -.2, 
                                  3* xu, 0, -zu, 1, 				1, 1, 1, 0, 0, -.2, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0, -.2, 
                                    //body top side triangle 1
                                  xu, 2 * yu, zu, 1, 				1, 1, 1, 0, .2, 0,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 1, 0, .2, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, .2, 0,
                                    //body top side triangle 2
                                  xu, 2 * yu, zu, 1, 				1, 1, 1, 0, 0.2, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0.2, 0,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0.2, 0,
                                    //body bottom side triangle 1
                                  xu, 0, zu, 1, 					0, 1, 1, 0, -.2, 0,
                                  xu, 0, -zu, 1, 					1, 0, 1, 0, -.2, 0,
                                  3* xu, 0, zu, 1, 				1, 1, 0, 0, -.2, 0,
                                    //body bottom side triangle 2
                                  xu, 0, -zu, 1, 					1, 1, 0, 0, -.2, 0,
                                  3* xu, 0, zu, 1, 				1, 0, 1, 0, -.2, 0,
                                  3* xu, 0, -zu, 1, 				0, 1, 1, 0, -.2, 0,
                                    //back triangle 1
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, .1, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, .125, .1, 0,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, .125, .1, 0,
                                    //back triangle 2
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, 0, .1, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, .125, 0, .1,
                                  3* xu, 0, -zu, 1, 				1, 1, 1, .125, 0, .1,
                                    //back triangle 3
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, -.1, 0,
                                  3* xu, 0, zu, 1, 				1, 1, 1, .125, -.1, 0,
                                  3* xu, 0, -zu, 1, 				1, 1, 1, .125, -.1, 0,
                                    //back triangle 4
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, 0, .1,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, .125, 0, .1,
                                  3* xu, 0, zu, 1, 				1, 1, 1, .125, 0, .1,
                                    //fin: dorsal
                                  xu, 2*yu, 0, 1,					1, 0, 0, 0, 0, -.1,
                                  3*xu, 2*yu, 0, 1, 				0, 1, 0, 0, 0, -.1,
                                  3*xu, 3*yu, 0, 1, 				1, 1, 0, 0, 0, -.1,
                                    //hat base 1
                                  .1, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                  .1, .55, -.375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                
                                    //hat base 2 
                                  .1, .55, -.375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, -.375, 1, 				.4, .4, .4, 0, .525, 0,
                                
                                    //top hat front side 1
                                  .20, .55, .2, 1,				0, 0, 0, -.12, 0, 0,
                                  .20, .55, -.2, 1,				0, 0, 0, -.12, 0, 0,
                                  .20, .85, -.2, 1, 				.7, .7, .7, -.12, 0, 0,
                                    //top hat front side 2
                                  .20, .85, .2, 1,				.7, .7, .7,-.12, 0, 0,
                                  .20, .55, .2, 1,				0, 0, 0,-.12, 0, 0,
                                  .20, .85, -.2, 1, 				.7, .7, .7,-.12, 0, 0,
                                
                                    //top hat back side 1
                                  .65, .55, .2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .55, -.2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7,.12, 0, 0,
                                    //top hat back side 2
                                  .65, .85, .2, 1,				.7, .7, .7,.12, 0, 0,
                                  .65, .55, .2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7,.12, 0, 0,
                                    //top hat left side 1
                                  .20, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                  .65, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                    //top hat left side 2
                                  .20, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .65, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .65, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                    //top hat right side 1
                                  .20, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                  .65, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                    //top hat right side 2
                                  .65, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                    //top hat top 1
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                    //top hat top 2
                                  .65, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                    //animated fin: tail side left
                                  0, 0, .04, 1,						1, 0, 0, 0, 0, .1,	//vert 1
                                  xu, yu, .04, 1, 					1, 0, 1, 0, 0, .1,	//vert 2
                                  xu, -yu, .04, 1,					0, 1, 1, 0, 0, .1,	//vert 3
                                    //animated fin: tail side right
                                  0, 0, -.04, 1,						1, 0, 0, 0, 0, -.1,	//vert 4
                                  xu, yu, -.04, 1, 					0, 1, 1, 0, 0, -.1,	//vert 5
                                  xu, -yu, -.04, 1,					1, 0, 1, 0, 0, -.1,	//vert 6
                                    //animated fin: tail top 1
                                  0, 0, .04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 1
                                  xu, yu, .04, 1, 					1, 0, 1, -0.02, .016, 0,	//vert 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 4
                                    //animated fin: tail top 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 4
                                  xu, yu, -.04, 1, 					0, 1, 1, -0.02, .016, 0,	//vert 5
                                  xu, yu, .04, 1, 					1, 0, 1, -0.02, .016, 0,	//vert 2
                                    //animated fin: tail back 1
                                  xu, yu, -.04, 1, 					0, 1, 1, .04, 0, 0,	//vert 5
                                  xu, yu, .04, 1, 					1, 0, 1, .04, 0, 0,	//vert 2
                                  xu, -yu, .04, 1,					0, 1, 1, .04, 0, 0,	//vert 3
                                    //animated fin: tail back 2
                                  xu, -yu, .04, 1,					0, 1, 1, .04, 0, 0,	//vert 3
                                  xu, yu, -.04, 1, 					0, 1, 1, .04, 0, 0,	//vert 5
                                  xu, -yu, -.04, 1,					1, 0, 1, .04, 0, 0,	//vert 6
                                    //animated fin: tail bottom 1
                                  0, 0, .04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 1
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 4
                                  xu, -yu, .04, 1,					0, 1, 1, -0.02, -.016, 0,	//vert 3
                                    //animated fin: tail bottom 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 4
                                  xu, -yu, .04, 1,					0, 1, 1, -0.02, -.016, 0,	//vert 3
                                  xu, -yu, -.04, 1,					1, 0, 1, -0.02, -.016, 0,	//vert 6
                                  //animated fin tetrahedron: right side1
                                  xu, 0, 0, 1,				1, 0, 1,    0, -.1, -0.05,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0,   0,-.1, -0.05,		//vert 2
                                  3*xu, -.125, zu, 1,			0, 1, 1, 0,-.1, -0.05,		//vert 3
                                  //animated fin right side 2
                                  xu, 0, 0, 1,				1, 0, 1, 0.01125, 0.1, 0.068,	//vert 1
                                  3*xu, .045, 0, 1, 			0, 1, 0, 0.01125, 0.1, 0.068,	//vert 4
                                  3*xu, -.125, zu, 1,			0, 1, 1, 0.01125,0.1, 0.068,	//vert 3
                                  //animated fin right side 3
                                  xu, 0, 0, 1,				1, 0, 1, 0, -0.045, 0,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0, 0, -0.045, 0,	//vert 2
                                  3*xu, .045, 0, 1, 			0, 1, 0, 0, -0.045, 0,	//vert 4
                                  //animated fin right side 4
                                  3*xu, 0, 0, 1, 				1, 1, 0, .05125, 0, 0,	//vert 2
                                  3*xu, -.125, zu, 1,			0, 1, 1, .05125, 0, 0,	//vert 3
                                  3*xu, .045, 0, 1, 			0, 1, 0, .05125, 0, 0,	//vert 4
                                  //animated fin: left side 1
                                  xu, 0, 0, 1,				1, 0, 1, -0.01125, 0.1, -0.068,	//vert 1
                                  3*xu, 0.045, 0, 1, 	1, 0, .3, -0.01125,0.1, -0.068,	//vert 4
                                  3*xu, -.125, -zu, 1,0, 1, 1, -0.01125, 0.1, -0.068,	//vert 3
                                  //animated fin: left side 2
                                  xu, 0, 0, 1,				1, 0, 1,	0,-.1, 0.05,//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0,	0,-.1, 0.05,//vert 2
                                  3*xu, -.125, -zu, 1,		0, 1, 1,	0,-.1, 0.05,//vert 3
                                  //animated fin: left side 3
                                  3*xu, 0.045, 0, 1, 			1, 0, .3, 0.01125, 0, 0,	//vert 4
                                  3*xu, 0    , 0, 1, 				1, 1, 0, 0.01125, 0, 0,		//vert 2
                                  3*xu, -.125, -zu, 1,		0, 1, 1, 0.01125, 0, 0,		//vert 3
                                  //animated fin: left side 4
                                  xu, 0, 0, 1,				1, 0, 1, 0, 0, -0.018,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0, 0, 0, -0.018,	//vert 2
                                  3*xu, 0.045, 0, 1, 			1, 0, .3, 0, 0, -0.018,//vert 4

                                  //OCTOPUS:
	0.0, 0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 0, 0, 0.10355,	// Node 1 A
	sq2/4,  sq2/4, 0.0, 1.0,  	0.0,  1.0,  1.0, 0, 0, -.25,	// Node 2 B
	-sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0, 0, 0,	// Node 0 H
	0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0, 0, 0,	// Node 2 C
	-0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0, 0, .25,	// Node 2 G
	sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0, 0, -.10355,	// Node 0 D
	-sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .42677, -0.17677, 0,	// Node 0 F
	0.0,  -0.5, 0.0, 1.0,  		1.0,  0.0,  1.0, .07322, 0.17677, 0,	// Node 2 E 
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, -.07322, -0.17677, 0,	// Node 0 F' //NULL VECTOR REPLACED TEMP
	-sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0.17677, 0.07322, 0,	// Node 0 F
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0.17677, 0.42677, 0,	// Node 0 F'
	-0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0.17677, -0.07322, 0,		// Node 2 G
	-0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0, -0.17677, -0.07322, 0,	// Node 2 G'
	-sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .07322, 0.17677, 0,// Node 0 H
	-sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0,-.07322, 0.17677, 0,// Node 0 H'
	0.0, 0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, .07322, 0.17677, 0, 	// Node 1 A // TEMP CHANGED
	0.0, 0.5, 0.5, 1.0, 		1.0,  0.0,  1.0, .07322, 0.17677, 0, 	// Node 1 A'
	sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, -0.17677, -0.07322, 0,	// Node 0 B
	sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0.17677, -0.07322, 0,	// Node 0 B'
	0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0,  0.17677, -0.07322, 0,	// Node 2 C
	0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0, 0.17677, -0.07322, 0,	// Node 2 C'
	sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .07322, -0.17677, 0,	// Node 0 D
	sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, .07322, -0.17677, 0,	// Node 0 D'
	0.0,  -0.5, 0.0, 1.0,  		1.0,  0.0,  1.0, -.07322, 0.17677, 0,	// Node 2 E
	0.0,  -0.5, 0.5, 1.0,  		1.0,  0.0,  1.0, 0, 0, 0.10355,	// Node 2 E'
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, -.25,	// Node 0 F'
	//top face
	sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, .35355,	// Node 0 D'
	-0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0,0, 0, -.35355,	// Node 2 G'
	0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0,0, 0, .25,	// Node 2 C'
	-sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0,0, 0, -0.10355,		// Node 0 H'
	sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, -0.10355,		// Node 0 B'
  0.0, 0.5, 0.5, 1.0, 		1.0,  0.0,  1.0, 0, 0, -0.10355,	 	// Node 1 A'
  
  //rectangular prism: 14 vertices
	0.0,	0.0, 0.0, 1.0,		0.0, 	0.0,	1.0, -sq2/8, sq2/8, 0,	// Node 0 O A
	sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	1.0,	0.0, sq2/8, -sq2/8, 0,	// Node 0 O C
	0.0,	0.0, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, -3/32,	// Node 0 O B
	sq2/8,	sq2/8, 1.0, 1.0,		1.0, 	0.0,	1.0, sq2/4, sq2/8, 0,	// Node 0 O D
	0.0,	0.5/sq2, 1.0, 1.0,		0.0, 	1.0,	1.0, -sq2/4, -sq2/8, 0,	// Node 0 O H
	sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	1.0,	0.0, 0, 0, -1/16,	// Node 0 O C
	0.0,	0.5/sq2, 0.0, 1.0,		1.0, 	1.0,	0.0, 0, 0, 1/16,	// Node 0 O G
	0.0,	0.0, 0.0, 1.0,		0.0, 	1.0,	1.0, -sq2/8, -sq2/8, 0,	// Node 0 O A
	-sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	0.0,	1.0, sq2/8, sq2/8, 0,	// Node 0 O E
	0.0,	0.0, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, 1/16,	// Node 0 O B
	-sq2/8,	sq2/8, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, 3/32,		// Node 0 O F
	0.0,	0.5/sq2, 1.0, 1.0,		0.0, 	1.0,	0.0, -sq2/4, sq2/8, 0,	// Node 0 O H
	-sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	0.0,	1.0, -sq2/4, sq2/8, 0,	// Node 0 O E
  0.0,	0.5/sq2, 0.0, 1.0,		0.0, 	1.0,	0.0, -sq2/4, sq2/8, 0,	// Node 0 O G
  
  //KELP VERTS
	0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .1, 0.025, // Node 0 O A
  0.4,  0.25, 0.0, 1.0,   0.0,  0.5,  0.3, -0.0625, .1, -0.025,  // Node 0 O E
  0.3,  0.25, 0.25, 1.0,    0.0,  0.9,  0.2, -0.0625, .05, 0.025, // Node 0 O D
  0.0,  0.0, 0.0, 1.0,    1.0,  1.0,  0.2, -0.0625, -.05, 0.025, // Node 0 O C
  0.2,  0.25, 0.0, 1.0,   0.0,  0.3,  0.1, 0.0625, .1, -0.025, // Node 0 O B
  0.3,  0.25, 0.25, 1.0,    0.0,  0.9,  0.2, .125, .15, 0, // Node 0 O D
  0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .1, -0.025,   // Node 0 O A
  0.3,  0.25, -0.25, 1.0,    0.0,  0.9,  0.2, -0.0625, .1, 0.025, // Node 0 O D'
  0.4,  0.25, 0.0, 1.0,   0.0,  0.5,  0.3, -0.0625, .1, 0.025, // Node 0 O E
  0.0,  0.0, 0.0, 1.0,    1.0,  1.0,  0.2,-0.0625, .05, -0.025,  // Node 0 O C
  0.3,  0.25, -0.25, 1.0,    0.0,  0.9,  0.2, 0.0625, .05, 0.025,  // Node 0 O D'
  0.2,  0.25, 0.0, 1.0,   0.0,  0.3,  0.1, 0.0625, .05, 0.025,  // Node 0 O B
  0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .05, 0.025,  // Node 0 O A
       ]);
    var fishsize = FishMathe.length;
    var VBO_0 = new Float32Array(mySiz + fishsize);
    for(i=0; i< sphVerts.length; i++ ){// don't initialize i -- reuse it!
      VBO_0[i] = sphVerts[i];}
    for(i = mySiz; i < fishsize + mySiz; i++)
    {
        VBO_0[i] = FishMathe[i - mySiz];
    }
    this.vboContents = VBO_0;

    this.g_modelMatrix = new Matrix4();
    this.g_modelMatrix.setIdentity();
  
    this.vboVerts = this.vboContents.length/10;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    // console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
    //                 this.vboFcount_a_Colr0) *   // every attribute in our VBO
    //                 this.FSIZE == this.vboStride, // for agreeement with'stride'
    //                 "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform

    //**new */
    this.a_Position;
    this.a_Color;
    this.a_Normal;
    this.u_ModelMatrix;
    this.u_MvpMatrix;
    this.modelMatrix;
    this.u_NormalMatrix;
    this.normalMatrix;
    this.mvpMatrix;
    this.lamp0 = new LightsT();
    this.eyePosWorld = new Float32Array(3);	// x,y,z in world coords
    this.u_eyePosWorld;
    this.u_blinnLighting;
    this.matl0 = new Material(MATL_BRASS);	
    this.matl0.setMatl(MATL_BRASS);
    this.matl1 = new Material(MATL_TURQUOISE);	
    this.matl1.setMatl(MATL_TURQUOISE);
    this.matl2 = new Material(MATL_RUBY);	
    this.matl2.setMatl(MATL_RUBY);
    this.matl3 = new Material(MATL_PEARL);	
    this.matl3.setMatl(MATL_PEARL);
    this.matl4 = new Material(MATL_SILVER_SHINY);	
    this.matl4.setMatl(MATL_SILVER_SHINY);
    this.blinnSub = new Float32Array(3);

  }
  function makeSphere() {
    var floatsPerVertex = 10;
    //==============================================================================
    // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
    // equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
    // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
    // sphere from one triangle strip.
      var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
                          // (choose odd # or prime# to avoid accidental symmetry)
      var sliceVerts	= 27;	// # of vertices around the top edge of the slice
                          // (same number of vertices on bottom of slice, too)
      var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
      var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
      var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
      var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
    
      // Create a (global) array to hold this sphere's vertices:
      sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                        // # of vertices * # of elements needed to store them. 
                        // each slice requires 2*sliceVerts vertices except 1st and
                        // last ones, which require only 2*sliceVerts-1.
                        
      // Create dome-shaped top slice of sphere at z=+1
      // s counts slices; v counts vertices; 
      // j counts array elements (vertices * elements per vertex)
      var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
      var sin0 = 0.0;
      var cos1 = 0.0;
      var sin1 = 0.0;	
      var j = 0;							// initialize our array index
      var isLast = 0;
      var isFirst = 1;
      for(s=0; s<slices; s++) {	// for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if(s==0) {
          isFirst = 1;	// skip 1st vertex of 1st slice.
          cos0 = 1.0; 	// initialize: start at north pole.
          sin0 = 0.0;
        }
        else {					// otherwise, new top edge == old bottom edge
          isFirst = 0;	
          cos0 = cos1;
          sin0 = sin1;
        }								// & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s+1)*sliceAngle);
        sin1 = Math.sin((s+1)*sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if(s==slices-1) isLast=1;	// skip last vertex of last slice.
        for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
          if(v%2==0)
          {				// put even# vertices at the the slice's top edge
                  // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                  // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
            sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
            sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
            sphVerts[j+2] = cos0;		
            sphVerts[j+3] = 1.0;	
            sphVerts[j+7] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
            sphVerts[j+8] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
            sphVerts[j+9] = cos0;				
          }
          else { 	// put odd# vertices around the slice's lower edge;
                  // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                  // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
            sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
            sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
            sphVerts[j+2] = cos1;																				// z
            sphVerts[j+3] = 1.0;																				// w.		
            sphVerts[j+7] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
            sphVerts[j+8] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
            sphVerts[j+9] = cos1;																				// z
          }
          if(s==0) {	// finally, set some interesting colors for vertices:
            sphVerts[j+4]=topColr[0]; 
            sphVerts[j+5]=topColr[1]; 
            sphVerts[j+6]=topColr[2];	
            }
          else if(s==slices-1) {
            sphVerts[j+4]=botColr[0]; 
            sphVerts[j+5]=botColr[1]; 
            sphVerts[j+6]=botColr[2];	
          }
          else {
              sphVerts[j+4]=Math.random();// equColr[0]; 
              sphVerts[j+5]=Math.random();// equColr[1]; 
              sphVerts[j+6]=Math.random();// equColr[2];					
          }
        }
      }
    }
  VBObox1.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)

    //Get graphics system's handle for our Vertex Shader's position-input variable: 
  this.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (this.a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  this.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(this.a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  // Get graphics system's handle for our Vertex Shader's normal-vec-input variable;
  this.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if(this.a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }

  this.u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!this.u_ModelMatrix) { 
    console.log('Failed to get GPU storage location for u_ModelMatrix');
    return;
  }
  this.u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!this.u_MvpMatrix) { 
    console.log('Failed to get GPU storage location for u_MvpMatrix');
    return;
  }
  this.u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  if (!this.u_MvpMatrix) { 
    console.log('Failed to get GPU storage location for u_eyePosWorld');
    return;
  }
  this.u_blinnLighting = gl.getUniformLocation(gl.program, 'u_blinnLighting');
  if (!this.u_blinnLighting) { 
    console.log('Failed to get GPU storage location for u_blinnLighting');
    return;
  }

  this.lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  this.lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

	// ... for Phong material/reflectance:
	this.matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	this.matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	this.matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	this.matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	this.matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
			  	  		    || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}
	// Position the camera in world coordinates:
	this.eyePosWorld.set([6.0, 0.0, 0.0]);
  gl.uniform3fv(this.u_eyePosWorld, this.eyePosWorld);// use it to set our uniform
  // Update lighting type
  this.blinnSub.set([0.0, 0.0, 0.0]);
  gl.uniform3fv(this.u_blinnLighting, this.blinnSub);// use it to set our uniform
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
  this.lamp0.I_pos.elements.set(lightPos);
  this.lamp0.I_ambi.elements.set(lightAmb);
  this.lamp0.I_diff.elements.set(lightDif);
  this.lamp0.I_spec.elements.set(lightSpec);

  // Create our JavaScript 'model' matrix (we send its values to GPU)
  this.modelMatrix = new Matrix4();
  //------------------------------------------------------------------
	// Get handle to graphics systems' storage location for u_NormalMatrix
	this.u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	if(!this.u_NormalMatrix) {
		console.log('Failed to get GPU storage location for u_NormalMatrix');
		return;
	}
	// Create our JavaScript 'normal' matrix (we send its values to GPU
	this.normalMatrix = new Matrix4();

  }
  
  VBObox1.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //   gl.vertexAttribPointer(
  //     this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
  //     this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
  //     gl.FLOAT,			// type == what data type did we use for those numbers?
  //     false,				// isNormalized == are these fixed-point values that we need
  //                   //									normalize before use? true or false
  //     this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
  //                   // stored attrib for this vertex to the same stored attrib
  //                   //  for the next vertex in our VBO.  This is usually the 
  //                   // number of bytes used to store one complete vertex.  If set 
  //                   // to zero, the GPU gets attribute values sequentially from 
  //                   // VBO, starting at 'Offset'.	
  //                   // (Our vertex size in bytes: 4 floats for pos + 3 for color)
  //     this.vboOffset_a_Pos0);						
  //                   // Offset == how many bytes from START of buffer to the first
  //                   // value we will actually use?  (We start with position).
  //   gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
  //                         gl.FLOAT, false, 
  //                         this.vboStride, this.vboOffset_a_Colr0);
                  
  // // --Enable this assignment of each of these attributes to its' VBO source:
  //   gl.enableVertexAttribArray(this.a_PosLoc);
  //   gl.enableVertexAttribArray(this.a_ColrLoc);
    //**new */

      // Use handle to specify how to retrieve position data from our VBO:
    gl.vertexAttribPointer(
      this.a_Position, 	// choose Vertex Shader attribute to fill with data
      4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
      gl.FLOAT, 		// data type for each value: usually gl.FLOAT
      false, 				// did we supply fixed-point data AND it needs normalizing?
      this.FSIZE * 10, 	// Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
      0);						// Offset -- now many bytes from START of buffer to the
                    // value we will actually use?

    gl.vertexAttribPointer(
      this.a_Color, 				// choose Vertex Shader attribute to fill with data
      3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
      gl.FLOAT, 			// data type for each value: usually gl.FLOAT
      false, 					// did we supply fixed-point data AND it needs normalizing?
      this.FSIZE * 10, 		// Stride -- how many bytes used to store each vertex?
                      // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
                      this.FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  Need to skip over x,y,z,w
    gl.vertexAttribPointer(
      this.a_Normal, 				// choose Vertex Shader attribute to fill with data
      3, 							// how many values? 1,2,3 or 4. (we're using x,y,z)
      gl.FLOAT, 			// data type for each value: usually gl.FLOAT
      false, 					// did we supply fixed-point data AND it needs normalizing?
      this.FSIZE * 10, 		// Stride -- how many bytes used to store each vertex?
                      // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
      this.FSIZE * 7);			// Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  Need to skip over x,y,z,w,r,g,b
                    
    gl.enableVertexAttribArray(this.a_Position); 
    gl.enableVertexAttribArray(this.a_Color);  
                    // Enable assignment of vertex buffer object's position data
    gl.enableVertexAttribArray(this.a_Normal); 
  }
  
  VBObox1.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox1.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    // Adjust values for our uniforms,
    
    //useless
  
    //this.ModelMat.setRotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
    //this.ModelMat.translate(0.35, 0, 0);							// then translate them.
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    //gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
    //										false, 				// use matrix transpose instead?
    //										this.g_modelMatrix.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
  }
  
  VBObox1.prototype.draw = function() {
    //=============================================================================
    // Render current VBObox contents.
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      } 
      var sq2	= Math.sqrt(2.0);	
      // Send fresh 'uniform' values to the GPU:
      //---------------send camera position:
      // Position the camera in world coordinates:
    this.eyePosWorld.set([eyeX, eyeY, eyeZ]);
    gl.uniform3fv(this.u_eyePosWorld, this.eyePosWorld);// use it to set our uniform
    
    this.blinnSub.set([blinnLighting, 0.0, 0.0]);
    gl.uniform3fv(this.u_blinnLighting, this.blinnSub);// use it to set our uniform
      //---------------For the light source(s): 
      this.lamp0.I_pos.elements.set(lightPos);
    this.lamp0.I_ambi.elements.set(lightAmb);
    this.lamp0.I_diff.elements.set(lightDif);
    this.lamp0.I_spec.elements.set(lightSpec);
      gl.uniform3fv(this.lamp0.u_pos,  this.lamp0.I_pos.elements.slice(0,3));
      gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);		// ambient
      gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);		// diffuse
      gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);		// Specular
  
      //---------------For the Material object(s):
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
  
      this.mvpMatrix = new Matrix4();
      this.mvpMatrix.setIdentity();
      //set camera stuff
      //warning: g_modelMatrix is actually mvp matrix
      this.g_modelMatrix.setIdentity();
      // var vpAspect = (g_canvasID.width)/g_canvasID.height;	// this camera: width/height
      // var vpAspect = (canvasW)/canvasH;
      zfar = 1000
      znear = 1
      camFOV = 30.0
      this.mvpMatrix.perspective(camFOV,   // FOVY: top-to-bottom vertical image angle, in degrees
                            imageAspect,   // Image Aspect Ratio: camera lens width/height
                            znear,   // camera z-near distance (always positive; frustum begins at z = -znear)
                            zfar);  // camera z-far distance (always positive; frustum ends at z = -zfar)
      this.mvpMatrix.lookAt( eyeX, eyeY, eyeZ,	// center of projection
                  eyeX + Math.cos(camTheta), eyeY + Math.sin(camTheta), aimZ + eyeZ,
                          0, 0, 1);	// View UP vector. 0, 1, 0?
      //push all them matrices aww yes
      //since g model and mvp switched roles technically due to reasons I only half understand,
      //we switch the order they are pushed
      //hopefully this saves on code switching?
      
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      
  
  
  
      this.mvpMatrix.scale(0.1, 0.1, 0.1);	
      this.mvpMatrix.rotate(g_angleNow1, 0, 0, 1);
      this.mvpMatrix.scale(1.5, 1.5, 1.5);	
  
      //apply same transforms to the mvpMatrix	
      this.g_modelMatrix.scale(0.1, 0.1, 0.1);	
      this.g_modelMatrix.rotate(g_angleNow1, 0, 0, 1);
      this.mvpMatrix.scale(1.5, 1.5, 1.5);	
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
      //adjust normal mat to reflect the transformed model matrix
      gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.g_modelMatrix.elements);	// send data from Javascript.
      gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.mvpMatrix.elements);	// send data from Javascript.  
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.normalMatrix.elements);	// send data from Javascript.              
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                      0, 								// location of 1st vertex to draw;
                      700);		// number of vertices to draw on-screen.
  
        //it is fishmathe time 
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate(1,1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);				
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
  
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathe new
        gl.drawArrays(gl.TRIANGLES, 700, 51);
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl4.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl4.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl4.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl4.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl4.K_shiny, 10));     // Kshiny 
        gl.drawArrays(gl.TRIANGLES, 751, 36);
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
  
  
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate( 1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(.8, .25, 0);
        this.g_modelMatrix.rotate(tailangle, 0, 1, 0);
      
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(.8, .25, 0);
        this.mvpMatrix.rotate(tailangle, 0, 1, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathetail();
        gl.drawArrays(gl.TRIANGLES, 787, 24);
        
      
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate( 1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(0, .25, -.25);
        this.g_modelMatrix.rotate(sideangle, 1, 0, 0);
        
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate(1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(0, .25, -.25);
        this.mvpMatrix.rotate(sideangle, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathesideleft();
        gl.drawArrays(gl.TRIANGLES, 823, 12);
      
      
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate(1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(0,.25,.25);
        this.g_modelMatrix.rotate(-sideangle, 1, 0, 0);
      
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(0, .25, .25);
        this.mvpMatrix.rotate(-sideangle, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathesideright();
        gl.drawArrays(gl.TRIANGLES, 811, 12);
          
        //OCTOPUS TIME OH BOY
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl2.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl2.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl2.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl2.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl2.K_shiny, 10));     // Kshiny 
      this.g_modelMatrix = popMatrix();
      this.g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
                                                      // to match WebGL display canvas.
      this.g_modelMatrix.translate(1, -.5, 0);
      this.g_modelMatrix.scale(0.5, 0.5, 0.5);
      
              //draw connecting octagon
      this.g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
              //g_modelMatrix.rotate(90, 0, 1, 0);  // Make new drawing axes that
      this.g_modelMatrix.scale(0.25,0.25,0.25);
              //8 MATRIX PUSHES WERE DELETED HERE REMEMBER TO ADD THEM BACK IN AFTER TESTING 
      this.g_modelMatrix.rotate(180, 0, 1, 0);
      
              
      this.mvpMatrix = popMatrix();
      this.mvpMatrix.scale(1,1,-1);							// convert to left-handed coord sys
                                                      // to match WebGL display canvas.
      this.mvpMatrix.translate(1, -.5, 0);
      this.mvpMatrix.scale(0.5, 0.5, 0.5);
              //draw connecting octagon
      this.mvpMatrix.rotate(g_angle01, 0, 1, 0); 
              //g_modelMatrix.rotate(90, 0, 1, 0);  // Make new drawing axes that
      this.mvpMatrix.scale(0.25,0.25,0.25);
              //8 MATRIX PUSHES WERE DELETED HERE REMEMBER TO ADD THEM BACK IN AFTER TESTING 
      this.mvpMatrix.rotate(180, 0, 1, 0);
      
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              //g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
      gl.drawArrays(gl.TRIANGLE_STRIP, 835, 32);
              //draw torso
      this.g_modelMatrix.translate(0,0,.5);
      this.g_modelMatrix.scale(1.75,1.75,4);
      this.g_modelMatrix.rotate(45, 0, 0, 1);
      this.mvpMatrix.translate(0,0,.5);
      this.mvpMatrix.scale(1.75,1.75,4);
      this.mvpMatrix.rotate(45, 0, 0, 1);
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.g_modelMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.normalMatrix.elements);
      gl.drawArrays(gl.TRIANGLE_STRIP, 835, 32);
  
      //BOTTOM TENTACLE
              //move down to meet the corner of body
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              this.g_modelMatrix.translate(0.0,-.5,0);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(0.0,-.5,0);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.g_modelMatrix.elements);	// send data from Javascript.
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);  
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
              this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //BOTRIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              //move down to meet the corner of body
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              this.g_modelMatrix.translate(-sq2/4,-sq2/4,0);
              this.g_modelMatrix.rotate(-45,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-sq2/4,-sq2/4,0);
              this.mvpMatrix.rotate(-45,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //BOTLEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(sq2/4,-sq2/4,0);
              this.g_modelMatrix.rotate(45,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(sq2/4,-sq2/4,0);
              this.mvpMatrix.rotate(45,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //RIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(.5,0,0);
              this.g_modelMatrix.rotate(90,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(.5,0,0);
              this.mvpMatrix.rotate(90,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //LEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(-.5,0,0);
              this.g_modelMatrix.rotate(-90,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1)
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-.5,0,0);
              this.mvpMatrix.rotate(-90,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP RIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(sq2/4,sq2/4,0);
              this.g_modelMatrix.rotate(135,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(sq2/4,sq2/4,0);
              this.mvpMatrix.rotate(135,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP LEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(-sq2/4,sq2/4,0);
              this.g_modelMatrix.rotate(-135,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-sq2/4,sq2/4,0);
              this.mvpMatrix.rotate(-135,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(0,.5,0);
              this.g_modelMatrix.rotate(180,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(0,.5,0);
              this.mvpMatrix.rotate(180,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);  
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
      
  //KELP STARTS HERE
  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
            this.g_modelMatrix = popMatrix();
            this.g_modelMatrix.scale(1,1,-1);
            this.g_modelMatrix.scale(0.5, 0.5, 0.5);
            this.g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
            this.g_modelMatrix.scale(0.6,0.6,0.6);
            this.g_modelMatrix.rotate(180, 1, 0, 0);
            this.g_modelMatrix.translate(-2, 2, 0);
            this.g_modelMatrix.rotate(90, 1, 0, 0);
  
            this.mvpMatrix = popMatrix();
            this.mvpMatrix.scale(1,1,-1);
            this.mvpMatrix.scale(0.5, 0.5, 0.5);
            this.mvpMatrix.rotate(g_angle01, 0, 1, 0); 
            this.mvpMatrix.scale(0.6,0.6,0.6);
            this.mvpMatrix.rotate(180, 1, 0, 0);
            this.mvpMatrix.translate(-2, 2, 0);
            this.mvpMatrix.rotate(90, 1, 0, 0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
            gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
            this.g_modelMatrix.rotate(g_angle03*.1,1,0,0);
            this.mvpMatrix.rotate(g_angle03*.1,1,0,0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.3,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);  
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript. 
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements); 
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix = popMatrix();
            this.g_modelMatrix.scale(0.3, 0.3, 0.3);
            this.g_modelMatrix.translate(-1, 3, 0);
            this.g_modelMatrix.rotate(90, 1, 0, 0);
            this.mvpMatrix = popMatrix();
            this.mvpMatrix.scale(0.3, 0.3, 0.3);
            this.mvpMatrix.translate(-1, 3, 0);
            this.mvpMatrix.rotate(90, 1, 0, 0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            this.g_modelMatrix.rotate(g_angle03*.1,1,0,0);
            this.mvpMatrix.rotate(g_angle03*.1,1,0,0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.3,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
  
    }
  
  VBObox1.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  
  }
//NEW VBO2
function VBObox2() {
  //=============================================================================
  //=============================================================================
  // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
  // needed to render vertices from one Vertex Buffer Object (VBO) using one 
  // separate shader program (a vertex-shader & fragment-shader pair) and one
  // set of 'uniform' variables.
  
  // Constructor goal: 
  // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
  // written into code) in all other VBObox functions. Keeping all these (initial)
  // values here, in this one coonstrutor function, ensures we can change them 
  // easily WITHOUT disrupting any other code, ever!

  //HARD CODED TEST
  // lamp0.I_pos.elements.set( [6.0, 5.0, 5.0]);
  // lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  // lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  // lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);  

  // this.K_emit.push(0.0,      0.0,      0.0,      1.0);
	// 		this.K_ambi.push(0.329412, 0.223529, 0.027451, 1.0);
	// 		this.K_diff.push(0.780392, 0.568627, 0.113725, 1.0);
	// 		this.K_spec.push(0.992157, 0.941176, 0.807843, 1.0);   
	// 		this.K_shiny = 27.8974;
  //   this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  //   'precision highp float;\n' +
  //   'precision highp int;\n' +
  //   //--------------- GLSL Struct Definitions:
	// // 'struct LampT {\n' +		// Describes one point-like Phong light source
	// // '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
	// // 												//		   w==0.0 for distant light from x,y,z direction 
	// // ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	// // ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	// // '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	// // '}; \n' +
	// //
	// 'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
	// '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
	// '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
	// '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
	// '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
	// '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  // '		};\n' +
  // //------
  //   // 'uniform LampT u_LampSet[1];\n' +		// Array of all light sources. NEW
  //   'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials. NEW
  //   // 'uniform vec3 u_eyePosWorld; \n' + //NEW
  //   'uniform mat4 u_ModelMatrix;\n' +
  //   'uniform mat4 u_MvpMatrix;\n' +
  //   'uniform mat4 u_NormalMatrix;\n' +
  //   'uniform vec3 u_blinnLighting;\n' +
  //   'attribute vec4 a_Position;\n' +
  //   // 'attribute vec3 a_Color;\n' +
  //   'attribute vec3 a_Normal;\n' +
  //   // 'varying vec4 v_Color;\n' +
  //   'varying vec3 KD;\n' +
  //   'varying vec3 v_Normal;\n' +
  //   'varying vec4 v_Position;\n' +
  //   'void main() {\n' +
  //   'v_Position = u_ModelMatrix * a_Position; \n' +
  //   'vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
  //   'v_Normal = normalize(transVec.xyz);\n' +
  //   'vec3 u_eyePosWorld = vec3(2.0, 2.0, 1.0);\n' +	
  //   'vec3 eyePos = normalize(u_eyePosWorld - v_Position.xyz); \n' +	
  //   'vec3 lightPos = vec3(0.0, 1.0, 0.5);\n' +	
  //   'vec3 lightVec = normalize(lightPos - v_Position.xyz);\n' +	
  //   '  gl_Position = u_MvpMatrix * a_Position;\n' +
  //   '  float nDotL = max(dot(v_Normal, lightVec), 0.0);\n' +
  //   '  v_Color = vec4(0.3*a_Color + 0.7*dot(v_Normal,lightVec), 1.0);\n' +
  //   '  float lightTypeTerm;\n' +
  //   '  if(u_blinnLighting.x > 0.5){\n' + //BLINN
  //   '    vec3 H = normalize(lightVec + eyePos); \n' +
  //   '    lightTypeTerm = pow(max(dot(H, v_Normal), 0.0), float(u_MatlSet[0].shiny));\n' +
  //   '  }else{\n' +
  //   '    vec3 Rvec = normalize(reflect((-lightVec),v_Normal));\n' +		
  //   '    float rDotV = max(dot(Rvec, eyePos), 0.0);\n' +
  //   '    lightTypeTerm = pow(rDotV, float(u_MatlSet[0].shiny));\n' + //float(0);\n' +//pow(rDotV, float(u_MatlSet[0].shiny));\n' +
  //   // '    lightTypeTerm = 0.0;\n' +
  //   '  }\n' +
  //   '  vec3 ambient = u_LampSet[0].ambi*u_MatlSet[0].ambi;\n' +		
  //   '  vec3 diffuse = u_LampSet[0].diff*u_MatlSet[0].diff*nDotL;\n' +		
  //   '  vec3 spec = u_LampSet[0].spec*u_MatlSet[0].spec*lightTypeTerm;\n' +		
  //   '  v_Color = vec4(u_MatlSet[0].emit + ambient + diffuse + spec, 1.0);\n' +
  //   '}\n';
  this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    //------
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials. NEW
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Normal;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Position;\n' +
    'void main() {\n' +
    '  v_Position = u_ModelMatrix * a_Position; \n' +
    '  vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
    '  v_Normal = normalize(transVec.xyz);\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '}\n';
  
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision highp float;\n' +
    'precision highp int;\n' +
    'struct LampT {\n' +		// Describes one point-like Phong light source
    '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                            //		   w==0.0 for distant light from x,y,z direction 
    ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
    '}; \n' +
    
    'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
    '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
    '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +
    'uniform LampT u_LampSet[1];\n' +		// Array of all light sources. NEW
    'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials. NEW
    'uniform vec3 u_eyePosWorld; \n' + //NEW
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Position;\n' +
    'uniform vec3 u_blinnLighting;\n' +
    'void main() {\n' +
    'vec3 normal = normalize(v_Normal);\n' +	
    'vec3 eyePos = normalize(u_eyePosWorld - v_Position.xyz); \n' +	
    'vec3 lightVec = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +	
    '  float nDotL = max(dot(v_Normal, lightVec), 0.0);\n' +
    '  float lightTypeTerm;\n' +
    '  if(u_blinnLighting.x > 0.5){\n' + //BLINN
    '    vec3 H = normalize(lightVec + eyePos); \n' +
    '    lightTypeTerm = pow(max(dot(H, v_Normal), 0.0), float(u_MatlSet[0].shiny));\n' +
    '  }else{\n' +
    '    vec3 Rvec = normalize(reflect((-lightVec),v_Normal));\n' +		
    '    float rDotV = max(dot(Rvec, eyePos), 0.0);\n' +
    '    lightTypeTerm = pow(rDotV, float(u_MatlSet[0].shiny));\n' + //float(0);\n' +//pow(rDotV, float(u_MatlSet[0].shiny));\n' +
    // '    lightTypeTerm = 0.0;\n' +
    '  }\n' +
    '  vec3 ambient = u_LampSet[0].ambi*u_MatlSet[0].ambi;\n' +		
    '  vec3 diffuse = u_LampSet[0].diff*u_MatlSet[0].diff*nDotL;\n' +		
    '  vec3 spec = u_LampSet[0].spec*u_MatlSet[0].spec*lightTypeTerm;\n' +		
    '  gl_FragColor = vec4(u_MatlSet[0].emit + ambient + diffuse + spec, 1.0);\n' +
    '}\n';
    makeSphere();
    var mySiz = (sphVerts.length);
    var xu = .2;
    var yu = .25;
    var zu = .25;
    var sq2	= Math.sqrt(2.0);	
    var FishMathe = new Float32Array ([						// Array of vertex attribute values we will
                                  // transfer to GPU's vertex buffer object (VBO)
                                  0, yu, 0, 1, 					1, 0, 0, -.125, .1, 0,
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, -.125, .1, 0,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 0, -.125, .1, 0,
                                    //head triangle 2 
                                  0, yu, 0, 1, 					1, 0, 0, -.125, 0, 0.1, 
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, -.125, 0, 0.1, 
                                  xu, 0, zu, 1, 					1, 1, 1, -.125, 0, 0.1, 
                                    //head triangle 3
                                  0, yu, 0, 1, 					1, 0, 0,  -.125, -0.1, 0, 
                                  xu, 0, zu, 1, 					0, 0, 1, -.125, -0.1, 0,
                                  xu, 0, -zu, 1, 					1, 0, 1, -.125, -0.1, 0,
                                    //head triangle 4
                                  0, yu, 0, 1, 					1, 0, 0, -.125, 0, -0.1,
                                  xu, 0, -zu, 1, 					1, 1, 1, -.125, 0, -0.1,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 0, -.125, 0, -0.1,
                                    //body left side triangle 1
                                  xu, 0, zu, 1, 					1, 1, 1, 0, 0, .2, 
                                  xu, 2 * yu, zu, 1, 				0, 1, 1, 0, 0, .2, 
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0, .2, 
                                    //body left side triangle 2
                                  xu, 0, zu, 1, 					1, 1, 1, 0, 0, .2,  
                                  3* xu, 0, zu, 1, 				1, 1, 1, 0, 0, .2, 
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0, .2, 
                                    //body right side triangle 1
                                  xu, 0, -zu, 1, 					1, 1, 1, 0, 0, -.2, 
                                  xu, 2 * yu, -zu, 1, 			1, 1, 1, 0, 0, -.2, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0, -.2, 
                                    //body right side triangle 2
                                  xu, 0, -zu, 1, 					1, 1, 1, 0, 0, -.2, 
                                  3* xu, 0, -zu, 1, 				1, 1, 1, 0, 0, -.2, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0, -.2, 
                                    //body top side triangle 1
                                  xu, 2 * yu, zu, 1, 				1, 1, 1, 0, .2, 0,
                                  xu, 2 * yu, -zu, 1, 			1, 1, 1, 0, .2, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, .2, 0,
                                    //body top side triangle 2
                                  xu, 2 * yu, zu, 1, 				1, 1, 1, 0, 0.2, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, 0, 0.2, 0,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, 0, 0.2, 0,
                                    //body bottom side triangle 1
                                  xu, 0, zu, 1, 					0, 1, 1, 0, -.2, 0,
                                  xu, 0, -zu, 1, 					1, 0, 1, 0, -.2, 0,
                                  3* xu, 0, zu, 1, 				1, 1, 0, 0, -.2, 0,
                                    //body bottom side triangle 2
                                  xu, 0, -zu, 1, 					1, 1, 0, 0, -.2, 0,
                                  3* xu, 0, zu, 1, 				1, 0, 1, 0, -.2, 0,
                                  3* xu, 0, -zu, 1, 				0, 1, 1, 0, -.2, 0,
                                    //back triangle 1
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, .1, 0,
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, .125, .1, 0,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, .125, .1, 0,
                                    //back triangle 2
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, 0, .1, 
                                  3 * xu, 2 * yu, -zu, 1, 		1, 0, 0, .125, 0, .1,
                                  3* xu, 0, -zu, 1, 				1, 1, 1, .125, 0, .1,
                                    //back triangle 3
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, -.1, 0,
                                  3* xu, 0, zu, 1, 				1, 1, 1, .125, -.1, 0,
                                  3* xu, 0, -zu, 1, 				1, 1, 1, .125, -.1, 0,
                                    //back triangle 4
                                  4 * xu, yu, 0, 1, 				1, 0, 0, .125, 0, .1,
                                  3 * xu, 2 * yu, zu, 1, 			1, 0, 0, .125, 0, .1,
                                  3* xu, 0, zu, 1, 				1, 1, 1, .125, 0, .1,
                                    //fin: dorsal
                                  xu, 2*yu, 0, 1,					1, 0, 0, 0, 0, -.1,
                                  3*xu, 2*yu, 0, 1, 				0, 1, 0, 0, 0, -.1,
                                  3*xu, 3*yu, 0, 1, 				1, 1, 0, 0, 0, -.1,
                                    //hat base 1
                                  .1, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                  .1, .55, -.375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                
                                    //hat base 2 
                                  .1, .55, -.375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, .375, 1,				.4, .4, .4, 0, .525, 0,
                                  .8, .55, -.375, 1, 				.4, .4, .4, 0, .525, 0,
                                
                                    //top hat front side 1
                                  .20, .55, .2, 1,				0, 0, 0, -.12, 0, 0,
                                  .20, .55, -.2, 1,				0, 0, 0, -.12, 0, 0,
                                  .20, .85, -.2, 1, 				.7, .7, .7, -.12, 0, 0,
                                    //top hat front side 2
                                  .20, .85, .2, 1,				.7, .7, .7,-.12, 0, 0,
                                  .20, .55, .2, 1,				0, 0, 0,-.12, 0, 0,
                                  .20, .85, -.2, 1, 				.7, .7, .7,-.12, 0, 0,
                                
                                    //top hat back side 1
                                  .65, .55, .2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .55, -.2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7,.12, 0, 0,
                                    //top hat back side 2
                                  .65, .85, .2, 1,				.7, .7, .7,.12, 0, 0,
                                  .65, .55, .2, 1,				0, 0, 0,.12, 0, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7,.12, 0, 0,
                                    //top hat left side 1
                                  .20, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                  .65, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                    //top hat left side 2
                                  .20, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .65, .55, .2, 1,				0, 0, 0, 0, 0, .135,
                                  .65, .85, .2, 1,				.7, .7, .7, 0, 0, .135,
                                    //top hat right side 1
                                  .20, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                  .65, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                    //top hat right side 2
                                  .65, .55, -.2, 1,				0, 0, 0, 0, 0, -.135,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, 0, -.135,
                                    //top hat top 1
                                  .20, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                    //top hat top 2
                                  .65, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                  .65, .85, -.2, 1, 				.7, .7, .7, 0, .525, 0,
                                  .20, .85, .2, 1,				.7, .7, .7, 0, .525, 0,
                                    //animated fin: tail side left
                                  0, 0, .04, 1,						1, 0, 0, 0, 0, .1,	//vert 1
                                  xu, yu, .04, 1, 					1, 0, 1, 0, 0, .1,	//vert 2
                                  xu, -yu, .04, 1,					0, 1, 1, 0, 0, .1,	//vert 3
                                    //animated fin: tail side right
                                  0, 0, -.04, 1,						1, 0, 0, 0, 0, -.1,	//vert 4
                                  xu, yu, -.04, 1, 					0, 1, 1, 0, 0, -.1,	//vert 5
                                  xu, -yu, -.04, 1,					1, 0, 1, 0, 0, -.1,	//vert 6
                                    //animated fin: tail top 1
                                  0, 0, .04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 1
                                  xu, yu, .04, 1, 					1, 0, 1, -0.02, .016, 0,	//vert 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 4
                                    //animated fin: tail top 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, .016, 0,	//vert 4
                                  xu, yu, -.04, 1, 					0, 1, 1, -0.02, .016, 0,	//vert 5
                                  xu, yu, .04, 1, 					1, 0, 1, -0.02, .016, 0,	//vert 2
                                    //animated fin: tail back 1
                                  xu, yu, -.04, 1, 					0, 1, 1, .04, 0, 0,	//vert 5
                                  xu, yu, .04, 1, 					1, 0, 1, .04, 0, 0,	//vert 2
                                  xu, -yu, .04, 1,					0, 1, 1, .04, 0, 0,	//vert 3
                                    //animated fin: tail back 2
                                  xu, -yu, .04, 1,					0, 1, 1, .04, 0, 0,	//vert 3
                                  xu, yu, -.04, 1, 					0, 1, 1, .04, 0, 0,	//vert 5
                                  xu, -yu, -.04, 1,					1, 0, 1, .04, 0, 0,	//vert 6
                                    //animated fin: tail bottom 1
                                  0, 0, .04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 1
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 4
                                  xu, -yu, .04, 1,					0, 1, 1, -0.02, -.016, 0,	//vert 3
                                    //animated fin: tail bottom 2
                                  0, 0, -.04, 1,						1, 0, 0, -0.02, -.016, 0,	//vert 4
                                  xu, -yu, .04, 1,					0, 1, 1, -0.02, -.016, 0,	//vert 3
                                  xu, -yu, -.04, 1,					1, 0, 1, -0.02, -.016, 0,	//vert 6
                                  //animated fin tetrahedron: right side1
                                  xu, 0, 0, 1,				1, 0, 1,    0, -.1, -0.05,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0,   0,-.1, -0.05,		//vert 2
                                  3*xu, -.125, zu, 1,			0, 1, 1, 0,-.1, -0.05,		//vert 3
                                  //animated fin right side 2
                                  xu, 0, 0, 1,				1, 0, 1, 0.01125, 0.1, 0.068,	//vert 1
                                  3*xu, .045, 0, 1, 			0, 1, 0, 0.01125, 0.1, 0.068,	//vert 4
                                  3*xu, -.125, zu, 1,			0, 1, 1, 0.01125,0.1, 0.068,	//vert 3
                                  //animated fin right side 3
                                  xu, 0, 0, 1,				1, 0, 1, 0, -0.045, 0,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0, 0, -0.045, 0,	//vert 2
                                  3*xu, .045, 0, 1, 			0, 1, 0, 0, -0.045, 0,	//vert 4
                                  //animated fin right side 4
                                  3*xu, 0, 0, 1, 				1, 1, 0, .05125, 0, 0,	//vert 2
                                  3*xu, -.125, zu, 1,			0, 1, 1, .05125, 0, 0,	//vert 3
                                  3*xu, .045, 0, 1, 			0, 1, 0, .05125, 0, 0,	//vert 4
                                  //animated fin: left side 1
                                  xu, 0, 0, 1,				1, 0, 1, -0.01125, 0.1, -0.068,	//vert 1
                                  3*xu, 0.045, 0, 1, 	1, 0, .3, -0.01125,0.1, -0.068,	//vert 4
                                  3*xu, -.125, -zu, 1,0, 1, 1, -0.01125, 0.1, -0.068,	//vert 3
                                  //animated fin: left side 2
                                  xu, 0, 0, 1,				1, 0, 1,	0,-.1, 0.05,//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0,	0,-.1, 0.05,//vert 2
                                  3*xu, -.125, -zu, 1,		0, 1, 1,	0,-.1, 0.05,//vert 3
                                  //animated fin: left side 3
                                  3*xu, 0.045, 0, 1, 			1, 0, .3, 0.01125, 0, 0,	//vert 4
                                  3*xu, 0    , 0, 1, 				1, 1, 0, 0.01125, 0, 0,		//vert 2
                                  3*xu, -.125, -zu, 1,		0, 1, 1, 0.01125, 0, 0,		//vert 3
                                  //animated fin: left side 4
                                  xu, 0, 0, 1,				1, 0, 1, 0, 0, -0.018,	//vert 1
                                  3*xu, 0, 0, 1, 				1, 1, 0, 0, 0, -0.018,	//vert 2
                                  3*xu, 0.045, 0, 1, 			1, 0, .3, 0, 0, -0.018,//vert 4

                                  //OCTOPUS:
	0.0, 0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 0, 0, 0.10355,	// Node 1 A
	sq2/4,  sq2/4, 0.0, 1.0,  	0.0,  1.0,  1.0, 0, 0, -.25,	// Node 2 B
	-sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0, 0, 0,	// Node 0 H
	0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0, 0, 0,	// Node 2 C
	-0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0, 0, .25,	// Node 2 G
	sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0, 0, -.10355,	// Node 0 D
	-sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .42677, -0.17677, 0,	// Node 0 F
	0.0,  -0.5, 0.0, 1.0,  		1.0,  0.0,  1.0, .07322, 0.17677, 0,	// Node 2 E 
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, .07322, 0.17677, 0,	// Node 0 F' //NULL VECTOR REPLACED TEMP
	-sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, 0.17677, 0.07322, 0,	// Node 0 F
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0.17677, 0.42677, 0,	// Node 0 F'
	-0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0, 0.17677, -0.07322, 0,		// Node 2 G
	-0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0, -0.17677, -0.07322, 0,	// Node 2 G'
	-sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .07322, 0.17677, 0,// Node 0 H
	-sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0,-.07322, 0.17677, 0,// Node 0 H'
	0.0, 0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, .07322, 0.17677, 0, 	// Node 1 A // TEMP CHANGED
	0.0, 0.5, 0.5, 1.0, 		1.0,  0.0,  1.0, .07322, 0.17677, 0, 	// Node 1 A'
	sq2/4,  sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, -0.17677, -0.07322, 0,	// Node 0 B
	sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0.17677, -0.07322, 0,	// Node 0 B'
	0.5,  0.0, 0.0, 1.0,  		1.0,  0.0,  1.0,  0.17677, -0.07322, 0,	// Node 2 C
	0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0, 0.17677, -0.07322, 0,	// Node 2 C'
	sq2/4,  -sq2/4, 0.0, 1.0, 	0.0, 	1.0,	1.0, .07322, -0.17677, 0,	// Node 0 D
	sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, .07322, -0.17677, 0,	// Node 0 D'
	0.0,  -0.5, 0.0, 1.0,  		1.0,  0.0,  1.0, -.07322, 0.17677, 0,	// Node 2 E
	0.0,  -0.5, 0.5, 1.0,  		1.0,  0.0,  1.0, 0, 0, 0.10355,	// Node 2 E'
	-sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, -.25,	// Node 0 F'
	//top face
	sq2/4,  -sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, .35355,	// Node 0 D'
	-0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0,0, 0, -.35355,	// Node 2 G'
	0.5,  0.0, 0.5, 1.0,  		1.0,  0.0,  1.0,0, 0, .25,	// Node 2 C'
	-sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0,0, 0, -0.10355,		// Node 0 H'
	sq2/4,  sq2/4, 0.5, 1.0, 	1.0, 	1.0,	0.0, 0, 0, -0.10355,		// Node 0 B'
  0.0, 0.5, 0.5, 1.0, 		1.0,  0.0,  1.0, 0, 0, -0.10355,	 	// Node 1 A'
  
  //rectangular prism: 14 vertices
	0.0,	0.0, 0.0, 1.0,		0.0, 	0.0,	1.0, -sq2/8, sq2/8, 0,	// Node 0 O A
	sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	1.0,	0.0, sq2/8, -sq2/8, 0,	// Node 0 O C
	0.0,	0.0, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, -3/32,	// Node 0 O B
	sq2/8,	sq2/8, 1.0, 1.0,		1.0, 	0.0,	1.0, sq2/4, sq2/8, 0,	// Node 0 O D
	0.0,	0.5/sq2, 1.0, 1.0,		0.0, 	1.0,	1.0, -sq2/4, -sq2/8, 0,	// Node 0 O H
	sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	1.0,	0.0, 0, 0, -1/16,	// Node 0 O C
	0.0,	0.5/sq2, 0.0, 1.0,		1.0, 	1.0,	0.0, 0, 0, 1/16,	// Node 0 O G
	0.0,	0.0, 0.0, 1.0,		0.0, 	1.0,	1.0, -sq2/8, -sq2/8, 0,	// Node 0 O A
	-sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	0.0,	1.0, sq2/8, sq2/8, 0,	// Node 0 O E
	0.0,	0.0, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, 1/16,	// Node 0 O B
	-sq2/8,	sq2/8, 1.0, 1.0,		0.0, 	1.0,	1.0, 0, 0, 3/32,		// Node 0 O F
	0.0,	0.5/sq2, 1.0, 1.0,		0.0, 	1.0,	0.0, -sq2/4, sq2/8, 0,	// Node 0 O H
	-sq2/8,	sq2/8, 0.0, 1.0,		1.0, 	0.0,	1.0, -sq2/4, sq2/8, 0,	// Node 0 O E
  0.0,	0.5/sq2, 0.0, 1.0,		0.0, 	1.0,	0.0, -sq2/4, sq2/8, 0,	// Node 0 O G
  
  //KELP VERTS
	0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .1, 0.025, // Node 0 O A
  0.4,  0.25, 0.0, 1.0,   0.0,  0.5,  0.3, -0.0625, .1, -0.025,  // Node 0 O E
  0.3,  0.25, 0.25, 1.0,    0.0,  0.9,  0.2, -0.0625, .05, 0.025, // Node 0 O D
  0.0,  0.0, 0.0, 1.0,    1.0,  1.0,  0.2, -0.0625, -.05, 0.025, // Node 0 O C
  0.2,  0.25, 0.0, 1.0,   0.0,  0.3,  0.1, 0.0625, .1, -0.025, // Node 0 O B
  0.3,  0.25, 0.25, 1.0,    0.0,  0.9,  0.2, .125, .15, 0, // Node 0 O D
  0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .1, -0.025,   // Node 0 O A
  0.3,  0.25, -0.25, 1.0,    0.0,  0.9,  0.2, -0.0625, .1, 0.025, // Node 0 O D'
  0.4,  0.25, 0.0, 1.0,   0.0,  0.5,  0.3, -0.0625, .1, 0.025, // Node 0 O E
  0.0,  0.0, 0.0, 1.0,    1.0,  1.0,  0.2,-0.0625, .05, -0.025,  // Node 0 O C
  0.3,  0.25, -0.25, 1.0,    0.0,  0.9,  0.2, 0.0625, .05, 0.025,  // Node 0 O D'
  0.2,  0.25, 0.0, 1.0,   0.0,  0.3,  0.1, 0.0625, .05, 0.025,  // Node 0 O B
  0.0,  0.5, 0.0, 1.0,    1.0,  1.0,  0.2, 0.0625, .05, 0.025,  // Node 0 O A
       ]);
    var fishsize = FishMathe.length;
    var VBO_0 = new Float32Array(mySiz + fishsize);
    for(i=0; i< sphVerts.length; i++ ){// don't initialize i -- reuse it!
      VBO_0[i] = sphVerts[i];}
    for(i = mySiz; i < fishsize + mySiz; i++)
    {
        VBO_0[i] = FishMathe[i - mySiz];
    }
    this.vboContents = VBO_0;

    this.g_modelMatrix = new Matrix4();
    this.g_modelMatrix.setIdentity();
  
    this.vboVerts = this.vboContents.length/10;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd by 1 vboContents array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // total number of bytes stored in vboContents
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts; 
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex. 
  
                //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    // console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
    //                 this.vboFcount_a_Colr0) *   // every attribute in our VBO
    //                 this.FSIZE == this.vboStride, // for agreeement with'stride'
    //                 "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
  
                //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                                  // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                  // (4 floats * bytes/float) 
                                  // # of bytes from START of vbo to the START
                                  // of 1st a_Colr0 attrib value in vboContents[]
                //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
  
                //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform

    //**new */
    this.a_Position;
    this.a_Color;
    this.a_Normal;
    this.u_ModelMatrix;
    this.u_MvpMatrix;
    this.modelMatrix;
    this.u_NormalMatrix;
    this.normalMatrix;
    this.mvpMatrix;
    this.lamp0 = new LightsT();
    this.eyePosWorld = new Float32Array(3);	// x,y,z in world coords
    this.u_eyePosWorld;
    this.u_blinnLighting;
    this.matl0 = new Material(MATL_BRASS);	
    this.matl0.setMatl(MATL_BRASS);
    this.matl1 = new Material(MATL_TURQUOISE);	
    this.matl1.setMatl(MATL_TURQUOISE);
    this.matl2 = new Material(MATL_RUBY);	
    this.matl2.setMatl(MATL_RUBY);
    this.matl3 = new Material(MATL_PEARL);	
    this.matl3.setMatl(MATL_PEARL);
    this.matl4 = new Material(MATL_SILVER_SHINY);	
    this.matl4.setMatl(MATL_SILVER_SHINY);
    this.blinnSub = new Float32Array(3);

  }
  VBObox2.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
  
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                      this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)

    //Get graphics system's handle for our Vertex Shader's position-input variable: 
  this.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (this.a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }


  // Get graphics system's handle for our Vertex Shader's normal-vec-input variable;
  this.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if(this.a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }

  this.u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!this.u_ModelMatrix) { 
    console.log('Failed to get GPU storage location for u_ModelMatrix');
    return;
  }
  this.u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!this.u_MvpMatrix) { 
    console.log('Failed to get GPU storage location for u_MvpMatrix');
    return;
  }
  this.u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  if (!this.u_MvpMatrix) { 
    console.log('Failed to get GPU storage location for u_eyePosWorld');
    return;
  }
  this.u_blinnLighting = gl.getUniformLocation(gl.program, 'u_blinnLighting');
  if (!this.u_blinnLighting) { 
    console.log('Failed to get GPU storage location for u_blinnLighting');
    return;
  }

  this.lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  this.lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  this.lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  this.lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !this.lamp0.u_pos || !this.lamp0.u_ambi	|| !this.lamp0.u_diff || !this.lamp0.u_spec	) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

	// ... for Phong material/reflectance:
	this.matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	this.matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	this.matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	this.matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	this.matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	if(!this.matl0.uLoc_Ke || !this.matl0.uLoc_Ka || !this.matl0.uLoc_Kd 
			  	  		    || !this.matl0.uLoc_Ks || !this.matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}
	// Position the camera in world coordinates:
	this.eyePosWorld.set([6.0, 0.0, 0.0]);
  gl.uniform3fv(this.u_eyePosWorld, this.eyePosWorld);// use it to set our uniform
  // Update lighting type
  this.blinnSub.set([0.0, 0.0, 0.0]);
  gl.uniform3fv(this.u_blinnLighting, this.blinnSub);// use it to set our uniform
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
  this.lamp0.I_pos.elements.set(lightPos);
  this.lamp0.I_ambi.elements.set(lightAmb);
  this.lamp0.I_diff.elements.set(lightDif);
  this.lamp0.I_spec.elements.set(lightSpec);

  // Create our JavaScript 'model' matrix (we send its values to GPU)
  this.modelMatrix = new Matrix4();
  //------------------------------------------------------------------
	// Get handle to graphics systems' storage location for u_NormalMatrix
	this.u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	if(!this.u_NormalMatrix) {
		console.log('Failed to get GPU storage location for u_NormalMatrix');
		return;
	}
	// Create our JavaScript 'normal' matrix (we send its values to GPU
	this.normalMatrix = new Matrix4();

  }
  
  VBObox2.prototype.switchToMe = function() {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
    gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use.  
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			    // the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //   gl.vertexAttribPointer(
  //     this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
  //     this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
  //     gl.FLOAT,			// type == what data type did we use for those numbers?
  //     false,				// isNormalized == are these fixed-point values that we need
  //                   //									normalize before use? true or false
  //     this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
  //                   // stored attrib for this vertex to the same stored attrib
  //                   //  for the next vertex in our VBO.  This is usually the 
  //                   // number of bytes used to store one complete vertex.  If set 
  //                   // to zero, the GPU gets attribute values sequentially from 
  //                   // VBO, starting at 'Offset'.	
  //                   // (Our vertex size in bytes: 4 floats for pos + 3 for color)
  //     this.vboOffset_a_Pos0);						
  //                   // Offset == how many bytes from START of buffer to the first
  //                   // value we will actually use?  (We start with position).
  //   gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
  //                         gl.FLOAT, false, 
  //                         this.vboStride, this.vboOffset_a_Colr0);
                  
  // // --Enable this assignment of each of these attributes to its' VBO source:
  //   gl.enableVertexAttribArray(this.a_PosLoc);
  //   gl.enableVertexAttribArray(this.a_ColrLoc);
    //**new */

      // Use handle to specify how to retrieve position data from our VBO:
    gl.vertexAttribPointer(
      this.a_Position, 	// choose Vertex Shader attribute to fill with data
      4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
      gl.FLOAT, 		// data type for each value: usually gl.FLOAT
      false, 				// did we supply fixed-point data AND it needs normalizing?
      this.FSIZE * 10, 	// Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
      0);						// Offset -- now many bytes from START of buffer to the
                    // value we will actually use?
    gl.vertexAttribPointer(
      this.a_Normal, 				// choose Vertex Shader attribute to fill with data
      3, 							// how many values? 1,2,3 or 4. (we're using x,y,z)
      gl.FLOAT, 			// data type for each value: usually gl.FLOAT
      false, 					// did we supply fixed-point data AND it needs normalizing?
      this.FSIZE * 10, 		// Stride -- how many bytes used to store each vertex?
                      // (x,y,z,w, r,g,b, nx,ny,nz) * bytes/value
      this.FSIZE * 7);			// Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  Need to skip over x,y,z,w,r,g,b
                    
    gl.enableVertexAttribArray(this.a_Position); 
                    // Enable assignment of vertex buffer object's position data
    gl.enableVertexAttribArray(this.a_Normal); 
  }
  
  VBObox2.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox2.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.adjust() call you needed to call this.switchToMe()!!');
    }  
    // Adjust values for our uniforms,
    
    //useless
  
    //this.ModelMat.setRotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
    //this.ModelMat.translate(0.35, 0, 0);							// then translate them.
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    //gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
    //										false, 				// use matrix transpose instead?
    //										this.g_modelMatrix.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
  }
  
  VBObox2.prototype.draw = function() {
    //=============================================================================
    // Render current VBObox contents.
      // check: was WebGL context set to use our VBO & shader program?
      if(this.isReady()==false) {
            console.log('ERROR! before' + this.constructor.name + 
                  '.draw() call you needed to call this.switchToMe()!!');
      } 
      var sq2	= Math.sqrt(2.0);	
      // Send fresh 'uniform' values to the GPU:
      //---------------send camera position:
      // Position the camera in world coordinates:
    this.eyePosWorld.set([eyeX, eyeY, eyeZ]);
    gl.uniform3fv(this.u_eyePosWorld, this.eyePosWorld);// use it to set our uniform
    
    this.blinnSub.set([blinnLighting, 0.0, 0.0]);
    gl.uniform3fv(this.u_blinnLighting, this.blinnSub);// use it to set our uniform
      //---------------For the light source(s): 
      this.lamp0.I_pos.elements.set(lightPos);
    this.lamp0.I_ambi.elements.set(lightAmb);
    this.lamp0.I_diff.elements.set(lightDif);
    this.lamp0.I_spec.elements.set(lightSpec);
      gl.uniform3fv(this.lamp0.u_pos,  this.lamp0.I_pos.elements.slice(0,3));
      gl.uniform3fv(this.lamp0.u_ambi, this.lamp0.I_ambi.elements);		// ambient
      gl.uniform3fv(this.lamp0.u_diff, this.lamp0.I_diff.elements);		// diffuse
      gl.uniform3fv(this.lamp0.u_spec, this.lamp0.I_spec.elements);		// Specular
  
      //---------------For the Material object(s):
      gl.uniform3fv(this.matl0.uLoc_Ke, this.matl0.K_emit.slice(0,3));				// Ke emissive
      gl.uniform3fv(this.matl0.uLoc_Ka, this.matl0.K_ambi.slice(0,3));				// Ka ambient
      gl.uniform3fv(this.matl0.uLoc_Kd, this.matl0.K_diff.slice(0,3));				// Kd	diffuse
      gl.uniform3fv(this.matl0.uLoc_Ks, this.matl0.K_spec.slice(0,3));				// Ks specular
      gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl0.K_shiny, 10));     // Kshiny 
  
      this.mvpMatrix = new Matrix4();
      this.mvpMatrix.setIdentity();
      //set camera stuff
      //warning: g_modelMatrix is actually mvp matrix
      this.g_modelMatrix.setIdentity();
      var vpAspect = (g_canvasID.width)/g_canvasID.height;	// this camera: width/height.
      zfar = 1000
      znear = 1
      camFOV = 30.0
      this.mvpMatrix.perspective(camFOV,   // FOVY: top-to-bottom vertical image angle, in degrees
        imageAspect,   // Image Aspect Ratio: camera lens width/height
                            znear,   // camera z-near distance (always positive; frustum begins at z = -znear)
                            zfar);  // camera z-far distance (always positive; frustum ends at z = -zfar)
      this.mvpMatrix.lookAt( eyeX, eyeY, eyeZ,	// center of projection
                  eyeX + Math.cos(camTheta), eyeY + Math.sin(camTheta), eyeZ + aimZ,
                          0, 0, 1);	// View UP vector. 0, 1, 0?
      //push all them matrices aww yes
      //since g model and mvp switched roles technically due to reasons I only half understand,
      //we switch the order they are pushed
      //hopefully this saves on code switching?
      
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      pushMatrix(this.mvpMatrix);
      pushMatrix(this.g_modelMatrix);
      
  
  
  
      this.mvpMatrix.scale(0.1, 0.1, 0.1);	
      this.mvpMatrix.rotate(g_angleNow1, 0, 0, 1);
      this.mvpMatrix.scale(1.5, 1.5, 1.5);	
  
      //apply same transforms to the mvpMatrix
      this.g_modelMatrix.scale(0.1, 0.1, 0.1);	
      this.g_modelMatrix.rotate(g_angleNow1, 0, 0, 1);
      this.mvpMatrix.scale(1.5, 1.5, 1.5);	
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
      //adjust normal mat to reflect the transformed model matrix
      gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.g_modelMatrix.elements);	// send data from Javascript.
      gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.mvpMatrix.elements);	// send data from Javascript.  
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                            false, 				// use matrix transpose instead?
                            this.normalMatrix.elements);	// send data from Javascript.              
      // ----------------------------Draw the contents of the currently-bound VBO:
      gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                      // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                      //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                      0, 								// location of 1st vertex to draw;
                      700);		// number of vertices to draw on-screen.
  
        //it is fishmathe time 
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate(1,1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);				
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
  
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathe new
        gl.drawArrays(gl.TRIANGLES, 700, 51);
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl4.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl4.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl4.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl4.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl4.K_shiny, 10));     // Kshiny 
        gl.drawArrays(gl.TRIANGLES, 751, 36);
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl1.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl1.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl1.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl1.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl1.K_shiny, 10));     // Kshiny 
  
  
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate( 1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(.8, .25, 0);
        this.g_modelMatrix.rotate(tailangle, 0, 1, 0);
      
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(.8, .25, 0);
        this.mvpMatrix.rotate(tailangle, 0, 1, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathetail();
        gl.drawArrays(gl.TRIANGLES, 787, 24);
        
      
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate( 1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(0, .25, -.25);
        this.g_modelMatrix.rotate(sideangle, 1, 0, 0);
        
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate(1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(0, .25, -.25);
        this.mvpMatrix.rotate(sideangle, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathesideleft();
        gl.drawArrays(gl.TRIANGLES, 823, 12);
      
      
        this.g_modelMatrix = popMatrix();
        this.g_modelMatrix.translate(1, 1, 0.0);
        this.g_modelMatrix.rotate(90, 1, 0, 0);
        this.g_modelMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.g_modelMatrix.scale(1,1,-1);
        this.g_modelMatrix.scale(0.5, 0.5, 0.5);
        this.g_modelMatrix.rotate(rocking, 1, 0, 0);
        this.g_modelMatrix.translate(0,.25,.25);
        this.g_modelMatrix.rotate(-sideangle, 1, 0, 0);
      
        this.mvpMatrix = popMatrix();
        this.mvpMatrix.translate( 1, 1, 0.0);	
        this.mvpMatrix.rotate(90, 1, 0, 0);
        this.mvpMatrix.rotate(g_angleNow1, 0, 1, 0);
        this.mvpMatrix.scale(1, 1, -1);	
        this.mvpMatrix.scale( .5, .5, 0.5);
        this.mvpMatrix.rotate(rocking, 1, 0, 0);
        this.mvpMatrix.translate(0, .25, .25);
        this.mvpMatrix.rotate(-sideangle, 1, 0, 0);
        this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
        gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.g_modelMatrix.elements);	// send data from Javascript.  
          gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
            false, 				// use matrix transpose instead?
            this.mvpMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.normalMatrix.elements);
        //fishemathesideright();
        gl.drawArrays(gl.TRIANGLES, 811, 12);
          
        //OCTOPUS TIME OH BOY
        gl.uniform3fv(this.matl0.uLoc_Ke, this.matl2.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl2.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl2.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl2.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl2.K_shiny, 10));     // Kshiny 
      this.g_modelMatrix = popMatrix();
      this.g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
      // to match WebGL display canvas.
      this.g_modelMatrix.translate(1, -.5, 0);
      this.g_modelMatrix.scale(0.5, 0.5, 0.5);
              //draw connecting octagon
      this.g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
              //g_modelMatrix.rotate(90, 0, 1, 0);  // Make new drawing axes that
      this.g_modelMatrix.scale(0.25,0.25,0.25);
              //8 MATRIX PUSHES WERE DELETED HERE REMEMBER TO ADD THEM BACK IN AFTER TESTING 
      this.g_modelMatrix.rotate(180, 0, 1, 0);
              
      this.mvpMatrix = popMatrix();
      this.mvpMatrix.scale(1,1,-1);							// convert to left-handed coord sys
                                                      // to match WebGL display canvas
      this.mvpMatrix.translate(1, -.5, 0);
      this.mvpMatrix.scale(0.5, 0.5, 0.5);
              //draw connecting octagon
      this.mvpMatrix.rotate(g_angle01, 0, 1, 0); 
              //g_modelMatrix.rotate(90, 0, 1, 0);  // Make new drawing axes that
      this.mvpMatrix.scale(0.25,0.25,0.25);
              //8 MATRIX PUSHES WERE DELETED HERE REMEMBER TO ADD THEM BACK IN AFTER TESTING 
      this.mvpMatrix.rotate(180, 0, 1, 0);
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              //g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
      gl.drawArrays(gl.TRIANGLE_STRIP, 835, 32);
              //draw torso
      this.g_modelMatrix.translate(0,0,.5);
      this.g_modelMatrix.scale(1.75,1.75,4);
      this.g_modelMatrix.rotate(45, 0, 0, 1);
      this.mvpMatrix.translate(0,0,.5);
      this.mvpMatrix.scale(1.75,1.75,4);
      this.mvpMatrix.rotate(45, 0, 0, 1);
      this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
      gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.g_modelMatrix.elements);	// send data from Javascript.  
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.normalMatrix.elements);
      gl.drawArrays(gl.TRIANGLE_STRIP, 835, 32);
  
      //BOTTOM TENTACLE
              //move down to meet the corner of body
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              this.g_modelMatrix.translate(0.0,-.5,0);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(0.0,-.5,0);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.g_modelMatrix.elements);	// send data from Javascript.
        gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
          false, 				// use matrix transpose instead?
          this.mvpMatrix.elements);  
      gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
              this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //BOTRIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              //move down to meet the corner of body
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              this.g_modelMatrix.translate(-sq2/4,-sq2/4,0);
              this.g_modelMatrix.rotate(-45,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-sq2/4,-sq2/4,0);
              this.mvpMatrix.rotate(-45,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //BOTLEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(sq2/4,-sq2/4,0);
              this.g_modelMatrix.rotate(45,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(sq2/4,-sq2/4,0);
              this.mvpMatrix.rotate(45,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //RIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(.5,0,0);
              this.g_modelMatrix.rotate(90,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(.5,0,0);
              this.mvpMatrix.rotate(90,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //LEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(-.5,0,0);
              this.g_modelMatrix.rotate(-90,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1)
  
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-.5,0,0);
              this.mvpMatrix.rotate(-90,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP RIGHT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(sq2/4,sq2/4,0);
              this.g_modelMatrix.rotate(135,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(sq2/4,sq2/4,0);
              this.mvpMatrix.rotate(135,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP LEFT TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(-sq2/4,sq2/4,0);
              this.g_modelMatrix.rotate(-135,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(-sq2/4,sq2/4,0);
              this.mvpMatrix.rotate(-135,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
            
              //TOP TENTACLE
              this.g_modelMatrix = popMatrix();
              this.g_modelMatrix.translate(1, -.5, 0);
              this.g_modelMatrix.rotate(180, 0, 1, 0);
              this.g_modelMatrix.scale(0.15,0.15,0.15);
              //move down to meet the corner of body
              this.g_modelMatrix.translate(0,.5,0);
              this.g_modelMatrix.rotate(180,0,0,1);
              this.g_modelMatrix.rotate(g_angle03,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,1);
              this.mvpMatrix = popMatrix();
              this.mvpMatrix.translate(1, -.5, 0);
              this.mvpMatrix.rotate(180, 0, 1, 0);
              this.mvpMatrix.scale(0.15,0.15,0.15);
              this.mvpMatrix.translate(0,.5,0);
              this.mvpMatrix.rotate(180,0,0,1);
              this.mvpMatrix.rotate(g_angle03,1,0,0);
              this.mvpMatrix.scale(0.75,.75,1);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 1st segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);  
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 2nd segment of arm
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
              this.g_modelMatrix.translate(0,0,1,0);
              this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
              this.g_modelMatrix.scale(0.75,.75,.8);
              this.mvpMatrix.translate(0,0,1,0);
              this.mvpMatrix.rotate(g_angle03*.5,1,0,0);
              this.mvpMatrix.scale(0.75,.75,.8);
              this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
              gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript. 
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements); 
              gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
              //draw 3rd segment
              gl.drawArrays(gl.TRIANGLE_STRIP, 867, 14);
      
  //KELP STARTS HERE
  gl.uniform3fv(this.matl0.uLoc_Ke, this.matl3.K_emit.slice(0,3));				// Ke emissive
        gl.uniform3fv(this.matl0.uLoc_Ka, this.matl3.K_ambi.slice(0,3));				// Ka ambient
        gl.uniform3fv(this.matl0.uLoc_Kd, this.matl3.K_diff.slice(0,3));				// Kd	diffuse
        gl.uniform3fv(this.matl0.uLoc_Ks, this.matl3.K_spec.slice(0,3));				// Ks specular
        gl.uniform1i(this.matl0.uLoc_Kshiny, parseInt(this.matl3.K_shiny, 10));     // Kshiny 
            this.g_modelMatrix = popMatrix();
            this.g_modelMatrix.scale(1,1,-1);
            this.g_modelMatrix.scale(0.5, 0.5, 0.5);
            this.g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
            this.g_modelMatrix.scale(0.6,0.6,0.6);
            this.g_modelMatrix.rotate(180, 1, 0, 0);
            this.g_modelMatrix.translate(-2, .2, 0);
            this.g_modelMatrix.rotate(90, 1, 0, 0);
  
            this.mvpMatrix = popMatrix();
            this.mvpMatrix.scale(1,1,-1);
            this.mvpMatrix.scale(0.5, 0.5, 0.5);
            this.mvpMatrix.rotate(g_angle01, 0, 1, 0); 
            this.mvpMatrix.scale(0.6,0.6,0.6);
            this.mvpMatrix.rotate(180, 1, 0, 0);
            this.mvpMatrix.translate(-2, 2, 0);
            this.mvpMatrix.rotate(90, 1, 0, 0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.g_modelMatrix.elements);	// send data from Javascript.  
                gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                  false, 				// use matrix transpose instead?
                  this.mvpMatrix.elements);
            gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.normalMatrix.elements);
            this.g_modelMatrix.rotate(g_angle03*.1,1,0,0);
            this.mvpMatrix.rotate(g_angle03*.1,1,0,0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.3,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);  
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript. 
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements); 
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix = popMatrix();
            this.g_modelMatrix.scale(0.3, 0.3, 0.3);
            this.g_modelMatrix.translate(-1, 3, 0);
            this.g_modelMatrix.rotate(90, 1, 0, 0);
            this.mvpMatrix = popMatrix();
            this.mvpMatrix.scale(0.3, 0.3, 0.3);
            this.mvpMatrix.translate(-1, 3, 0);
            this.mvpMatrix.rotate(90, 1, 0, 0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            this.g_modelMatrix.rotate(g_angle03*.1,1,0,0);
            this.mvpMatrix.rotate(g_angle03*.1,1,0,0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.3,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
            this.g_modelMatrix.translate(0,0.5,0);
            this.g_modelMatrix.rotate(g_angle03*.5,1,0,0);
            this.mvpMatrix.translate(0,0.5,0);
            this.mvpMatrix.rotate(g_angle03*.3,1,0,0);
            this.normalMatrix.setInverseOf(this.g_modelMatrix);
      this.normalMatrix.transpose();
            gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.g_modelMatrix.elements);	// send data from Javascript.  
              gl.uniformMatrix4fv(this.u_MvpMatrix,	// GPU location of the uniform
                false, 				// use matrix transpose instead?
                this.mvpMatrix.elements);
          gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
              false, 				// use matrix transpose instead?
              this.normalMatrix.elements);
            gl.drawArrays(gl.TRIANGLE_STRIP, 881, 13);
  
    }
  
  VBObox2.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU inside our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  
  }

function myKeyDown(kev) {
  //===============================================================================
  // Called when user presses down ANY key on the keyboard;
  //
  // For a light, easy explanation of keyboard events in JavaScript,
  // see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
  // For a thorough explanation of a mess of JavaScript keyboard event handling,
  // see:    http://javascript.info/tutorial/keyboard-events
  //
  // NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
  //        'keydown' event deprecated several read-only properties I used
  //        previously, including kev.charCode, kev.keyCode. 
  //        Revised 2/2019:  use kev.key and kev.code instead.
  //
  // Report EVERYTHING in console:
    console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
                "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
                "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
  
  // and report EVERYTHING on webpage:
   
    switch(kev.code) {
      //------------------WASD navigation-----------------
      case "ArrowRight":
        console.log("a/A key: Negatively increased rotation\n");
        camTheta -= .1;
        break;
      case "ArrowLeft":
        console.log("d/D key: Positively increased rotation\n");
        camTheta += .1;
        break;
    case "ArrowUp":
        console.log("d/D key: Positively increased rotation\n");
        aimZ += 0.1;
        break;
    case "ArrowDown":
        console.log("d/D key: Positively increased rotation\n");
        aimZ -= 0.1;
        break;
    case "KeyW": //move forward
        console.log("d/D key: Positively increased rotation\n");
        distX = Math.cos(camTheta) * camVel
        distY = Math.sin(camTheta) * camVel
        distZ = (aimZ) * camVel
        eyeX += distX
        eyeY += distY
        eyeZ += distZ
        break;
    case "KeyS": //move backward
        console.log("d/D key: Positively increased rotation\n");
        distX = Math.cos(camTheta) * camVel
        distY = Math.sin(camTheta) * camVel
        distZ = (aimZ) * camVel
        eyeX -= distX
        eyeY -= distY
        eyeZ -= distZ
        break;
    case "KeyD": //strafe right
        console.log("d/D key: Positively increased rotation\n");
        // L = eyeX + Math.cos(camTheta), eyeY + Math.sin(camTheta), aimZ,
        // D = (L - E) * vel
        // E += D; L+= D
        distX = Math.cos(camTheta) * camVel
        distY = Math.sin(camTheta) * camVel
        eyeX += distY
        eyeY -= distX
        break;
    case "KeyA": //strafe left
        console.log("d/D key: Positively increased rotation\n");
        distX = Math.cos(camTheta) * camVel
        distY = Math.sin(camTheta) * camVel
        eyeX -= distY
        eyeY += distX
        break;
    case "KeyQ": //move up
        eyeZ += 0.1
        break;
    case "KeyE": //move down
        eyeZ -= 0.1
        break;
    case "Escape": 
        console.log("d/D key: Positively increased rotation\n");
        eyeX = 2;
        eyeY = 2;
        eyeZ = 1;
        aimZ = 0.5;
        camTheta = 79.4;
        break;
        break;
    }
  }