// 2015.03.08   courtesy Alex Ayerdi
// 2016.02.22		J. Tumblin revised comments & return value names
// 2016.03.01		J. Tumblin added K_name member; added data members to hold
//							GPU's 'uniform' locations for its MatlT struct members;
//							added 'setMatl()' function to allow change of materials without
//							calling constructor (it discards GPU locations kept in uLoc_XX).
//------------------------------------------------------------------------------
// These emissive, ambient, diffuse, specular components were chosen for
// least-squares best-fit to measured BRDFs of actual material samples.
// (values copied from pg. 51, "Advanced Graphics Programming"
// Tom McReynolds, David Blythe Morgan-Kaufmann Publishers (c)2005).
//
// They demonstrate both the strengths and the weaknesses of Phong lighting: 
// if their appearance makes you ask "how could we do better than this?"
// then look into 'Cook-Torrance' shading methods, texture maps, bump maps, 
// and beyond.
//
// For each of our Phong Material Types, define names 
// that each get assigned a unique integer identifier:

var MATL_FISHMATH = 1;
var MATL_OCTOPUS = 	2;
var MATL_KELP = 	3;
var MATL_STINGRAY = 4;
var MATL_DOLPHIN = 	5;
var MATL_FISHHAT = 	6;
var MATL_BALL = 	7;
var MATL_DEFAULT = 	8;		// (used for unrecognized material names)

/*
The code below defines a JavaScript material-describing object whose type we 
named 'Material'.  For example, to create a new 'Material' object named 
'myMatter', just call the constructor with the material you want:
 
  var myMatter = new Material(materialType);
	(where 'materialType' is one of the MATL_*** vars listed above)

Within the myMatter object, member variables hold all the material-describing 
values needed for Phong lighting:

For example: For ambient, diffuse, and specular reflectance:
	myMatter.K_ambi[0], myMatter.K_ambi[1], myMatter.K_ambi[2] == ambient R,G,B
	myMatter.K_diff[0], myMatter.K_diff[1], myMatter.K_diff[2] == diffuse R,G,B
	myMatter.K_spec[0], myMatter.K_spec[1], myMatter.K_spec[2] == specular R,G,B
For emissive terms (not a reflectance; added to light returned from surface):
	myMatter.K_emit[0], myMatter.K_emit[1], myMatter.K_emit[2] == emissive R,G,B
For shinyness exponent, which grows as specular highlights get smaller/sharper: :
	myMatter.K_shiny    (one single floating point value

Your JavaScript code can use Material objects to set 'uniform' values sent to 
GLSL shader programs.  For example, to set a 'uniform' for diffuse reflectance: 
'emissive' value of the material:

myMatter.setMatl(MATL_CHROME);			// set 'myMatter' for chrome-like material
gl.uniform3f(u_Kd, myMatter.K_diff[0], myMatter.K_diff[1], myMatter.K_diff[2]);

or more compactly:

							gl.uniform3fv(u_Kd, myMatter.K_diff.slice(0,4));

	// NOTE: the JavaScript array myMatter.K_diff has *4* elements, not 3, due to
	// 			the alpha value (opacity) that follows R,G,B.  Javascript array member
	//			function 'slice(0,4)' returns only elements 0,1,2 (the r,g,b values).

*/

function Material(opt_Matl) {
//==============================================================================
// Constructor:  use these defaults:

	this.K_emit = [];		// JS arrays that hold 4 (not 3!) reflectance values: 
											// r,g,b,a where 'a'==alpha== opacity; usually 1.0.
											// (Opacity is part of this set of measured materials)
	this.K_ambi = [];
	this.K_diff = [];
	this.K_spec = [];
	this.K_shiny = 0.0;
	this.K_name = "Undefined Material";		// text string with material name.
	this.K_matlNum = 	MATL_DEFAULT;				// material number.
	
	// GPU location values for GLSL struct-member uniforms (LampT struct) needed
	// to transfer K values above to the GPU. Get these values using the
	// webGL fcn 'gl.getUniformLocation()'.  False for 'not initialized'.
	this.uLoc_Ke = false;
	this.uLoc_Ka = false;
	this.uLoc_Kd = false;
	this.uLoc_Ks = false;
	this.uLoc_Kshiny = false;
	// THEN: ?Did the user specified a valid material?
	if(		opt_Matl && opt_Matl >=0 && opt_Matl < MATL_DEFAULT)	{		
		this.setMatl(opt_Matl);			// YES! set the reflectance values (K_xx)
	}
	return this;
}

Material.prototype.setMatl = function(nuMatl) {
//==============================================================================
// Call this member function to change the Ke,Ka,Kd,Ks members of this object 
// to describe the material whose identifying number is 'nuMatl' (see list of
// these numbers and material names at the top of this file).
// This function DOES NOT CHANGE values of any of its uLoc_XX member variables.

	console.log('Called Material.setMatl( ', nuMatl,');'); 
	this.K_emit = [];			// DISCARD any current material reflectance values.
	this.K_ambi = [];
	this.K_diff = [];
	this.K_spec = [];
	this.K_name = [];
	this.K_shiny = 0.0;
	//  Set new values ONLY for material reflectances:
	switch(nuMatl)
	{
		case MATL_FISHMATH: // 1
			this.K_emit.push(0.0,     0.0,    0.0,    1.0);
			this.K_ambi.push(0.7,     0.7,    0.7,    1.0);
			this.K_diff.push(1.0,     0.7,    0.8,    1.0);
			this.K_spec.push(0.7,     0.7,    0.7,    1.0);   
			this.K_shiny = 60.0;
			this.K_name = "MATL_FISHMATH";
			break;
		case MATL_OCTOPUS: // 2
			this.K_emit.push(0.0,     0.0,    0.0,    1.0);
			this.K_ambi.push(0.4,    0.4,   0.4,   1.0);
			this.K_diff.push(0.7,     0.2,    0.6,    1.0);
			this.K_spec.push(0.4,     0.4,    0.4,    1.0);   
			this.K_shiny = 80.0;
			this.K_name = "MATL_OCTOPUS";
			break;
		case MATL_KELP: // 3
			this.K_emit.push(0.1,     0.1,    0.1,    1.0);
			this.K_ambi.push(0.25,    0.55,   0.25,   1.0);
			this.K_diff.push(0.0,     0.55,    0.1,    1.0);
			this.K_spec.push(0.3,     0.35,    0.3,    1.0);   
			this.K_shiny = 100.0;
			this.K_name = "MATL_KELP";
			break;
		case MATL_STINGRAY: //4
			this.K_emit.push(0.0,     0.0,    0.0,    1.0);
			this.K_ambi.push(0.4,     0.4,    0.0,    1.0);
			this.K_diff.push(0.7,    0.2,   0.3,   1.0);
			this.K_spec.push(0.1,     0.1,    0.1,    1.0);   
			this.K_shiny = 32.0;
			this.K_name = "MATL_STINGRAY";
			break;
		case MATL_DOLPHIN: //5
			this.K_emit.push(0.0,     0.0,    0.0,    1.0);
			this.K_ambi.push(0.6,    0.6,   0.6,   1.0);
			this.K_diff.push(0.7,    0.7,   0.0,   1.0);
			this.K_spec.push(0.3,     0.3,    0.3,    1.0);   
			this.K_shiny = 70.0;
			this.K_name = "MATL_DOLPHIN";
			break;
		case MATL_FISHHAT:
			this.K_emit.push(0.0,      0.0,      0.0,      1.0);
			this.K_ambi.push(0.329412, 0.223529, 0.027451, 1.0);
			this.K_diff.push(0.780392, 0.568627, 0.113725, 1.0);
			this.K_spec.push(0.992157, 0.941176, 0.807843, 1.0);   
			this.K_shiny = 27.8974;
			this.K_name = "MATL_FISHHAT";
			break;
		case MATL_BALL:
			this.K_emit.push(0.2,      0.2,      0.2,      1.0);
			this.K_ambi.push(0.65, 0.65, 0.65, 1.0);
			this.K_diff.push(0.75, 0.75, 0.75, 1.0);
			this.K_spec.push(0.4, 0.4, 0.4, 1.0);   
			this.K_shiny = 100.0;
			this.K_name = "MATL_FISHHAT";
			break;
		default:
			// ugly featureless (emissive-only) red:
			this.K_emit.push(0.5, 0.0, 0.0, 1.0); // DEFAULT: ugly RED emissive light only
			this.K_ambi.push(0.0, 0.0, 0.0, 1.0); // r,g,b,alpha  ambient reflectance
			this.K_diff.push(0.0, 0.0, 0.0, 1.0); //              diffuse reflectance
			this.K_spec.push(0.0, 0.0, 0.0, 1.0); //              specular reflectance
			this.K_shiny = 1.0;       // Default (don't set specular exponent to zero!)
			this.K_name = "DEFAULT_RED";
			break;
	}
	console.log('set to:', this.K_name, '\n');
	return this;
}
