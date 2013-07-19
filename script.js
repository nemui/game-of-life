// http://paulirish.com/2011/requestanimationframe-for-smart-animating
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame     || 
		  window.webkitRequestAnimationFrame || 
		  window.mozRequestAnimationFrame    || 
		  window.oRequestAnimationFrame      || 
		  window.msRequestAnimationFrame     || 
		  function( callback ){
				window.setTimeout(callback, 1000 / 60);
		  };
})();

var KGN = {
	WIDTH: 	0,
	HEIGHT: 0,	

	CELL_SIZE: 0,
	INTERVAL: 250,
	
	WHITE: 	"#FFFFFF",
	BLACK: 	"#000000",
	SUBTLE_GREEN: "#43F7DF",
	GREEN: "#00FF00",
	RED: "#FF0000",
	BLUE: "#0000FF",
	
	text: "LOADING",		
		
	canvas: 			null,
	ctx: 				null,
	ratio: 				0,
	currentWidth: 		0,
	currentHeight: 		0,	
	scale: 				1,
	offset: 			{top: 0, left: 0},			
	state:				null,

	init: function() {				
		KGN.canvas = document.getElementById('game_world');
		KGN.ctx = KGN.canvas.getContext('2d');
		
		KGN.CELL_SIZE = screen.width / 100;
		KGN.WIDTH = screen.width;
		KGN.HEIGHT = screen.height;
		
		KGN.canvas.width = KGN.WIDTH;
		KGN.canvas.height = KGN.HEIGHT;
		KGN.ratio = KGN.WIDTH / KGN.HEIGHT;				
		window.addEventListener('resize', KGN.resize, false);
							
		KGN.InGame.init();
		KGN.state = KGN.InGame;				        

		KGN.resize();
		KGN.loop();		
	},
	
	resize: function() {
		var width_ratio = KGN.WIDTH / window.innerWidth;
		var height_ratio = KGN.HEIGHT / window.innerHeight;

		if (height_ratio > width_ratio){
			KGN.currentHeight = window.innerHeight;
			KGN.currentWidth = KGN.currentHeight * KGN.ratio;
		}
		else{
			KGN.currentWidth = window.innerWidth;
			KGN.currentHeight = KGN.currentWidth / KGN.ratio;
		}

		if (KGN.android || KGN.ios ){
			document.body.style.height = (window.innerHeight + 50) + "px";
		}

		KGN.canvas.style.width = KGN.currentWidth + "px";
		KGN.canvas.style.height = KGN.currentHeight + "px";

		KGN.scale = KGN.currentWidth / KGN.WIDTH;
		KGN.offset.top = KGN.canvas.offsetTop;
		KGN.offset.left = KGN.canvas.offsetLeft;		

		window.setTimeout(function(){
			window.scrollTo(0, 1);
		}, 1);
	},
	
	update: function() {
		KGN.state.update();
	},
	
	render: function() {
		KGN.Draw.clear();		
		KGN.state.render();
	},
	
	loop: function() {
		requestAnimFrame( KGN.loop );

        KGN.update();
        KGN.render();
	},
	
	random: function(n){
		return ~~(Math.random()*n);
	}
};

KGN.InGame = {	
	cells: null,
	rows: 0,
	columns: 0,
	neighbour: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
	previous_ms: new Date().getTime(),	
	
	init: function(){				
		this.rows = ~~(KGN.HEIGHT / KGN.CELL_SIZE);
		this.columns = KGN.WIDTH / KGN.CELL_SIZE;		
		this.cells = new Array(this.rows);		
		for (var i = 0; i < this.rows; i++){
			this.cells[i] = new Array(this.columns);
			for (var j = 0; j < this.columns; j++){
				var c = KGN.RED;
				var number = KGN.random(3);				
				if (number == 1){
					c = KGN.GREEN;
				}
				else if (number == 2){
					c = KGN.BLUE;
				}				
				this.cells[i][j] = new KGN.Cell(j * KGN.CELL_SIZE, i * KGN.CELL_SIZE, KGN.random(2), c);
			}
		}
	},
	
	update: function(){	
		var this_ms = new Date().getTime();
		if (this_ms - this.previous_ms >= KGN.INTERVAL){
			this.previous_ms = this_ms;
			for (var i = 0; i < this.rows; i++){
				for (var j = 0; j < this.columns; j++){
					var alive = 0;	
					var c = "#";
					for (var k = 0; k < this.neighbour.length; k++){
						var ni = i + this.neighbour[k][0];
						var nj = j + this.neighbour[k][1];
						if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.columns && this.cells[ni][nj].status){							
							alive ++;	
							var color = this.cells[ni][nj].color;
							var ch = "00";
							var number = KGN.random(3);							
							while (ch == "00"){			
								ch = color.substring(number*2+1, number*2 + 3);								
								number = KGN.random(3);
							}							
							var chn = parseInt(ch, 16);
							number = KGN.random(3);
							if (number == 1){
								var halved = Math.floor(chn/2);
								chn = (halved < 30) ? 30 : halved;
							}
							else if (number == 2){
								var doubled = chn*2;
								chn = (doubled > 255) ? 255 : doubled;
							}
							c += chn.toString(16);
						}
					}
					if (alive < 2 || alive > 3){
						this.cells[i][j].next_status = 0;
					}					
					else if (alive == 3){
						this.cells[i][j].next_status = 1;
						if (this.cells[i][j].status == 0){
							this.cells[i][j].color = c;
						}
					}
					else {
						this.cells[i][j].next_status = this.cells[i][j].status;
					}
				}
			}
			for (var i = 0; i < this.rows; i++){
				for (var j = 0; j < this.columns; j++){
					this.cells[i][j].status = this.cells[i][j].next_status;
				}
			}
		}
	},
	
	render: function(){		
		for (var i = 0; i < this.rows; i++){
			for (var j = 0; j < this.columns; j++){
				this.cells[i][j].render();				
			}
		}
	}		
}

KGN.Draw = {
	clear: function() {
		KGN.ctx.clearRect(0, 0, KGN.WIDTH, KGN.HEIGHT);		
	},		

    rect: function(x, y, w, h, col, stroke) {
		var stroke = (stroke || false);
		if (stroke){
			KGN.ctx.strokeStyle = col;
			KGN.ctx.strokeRect(x, y, w, h);
		}
		else{
			KGN.ctx.fillStyle = col;
			KGN.ctx.fillRect(x, y, w, h);			
		}
    }	
};

KGN.Cell = function(x, y, status, color){
	this.x = x;
	this.y = y;		
	this.status = status;
	this.next_status = status;
	this.color = color;
	
	this.render = function(){
		KGN.Draw.rect(this.x, this.y, KGN.CELL_SIZE, KGN.CELL_SIZE, (this.status) ? this.color : KGN.BLACK);	
	};		
}