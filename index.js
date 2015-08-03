var caretpos = {x:0,y:0}

var selecting = false
var selection = {
	start:{x:0,y:0},
	end:{x:0,y:0}
}

function splice(str, index, count, add){
	return str.slice(0, index) + (add || "") + str.slice(index + count)
}

var code = ['function test(name) {','\tconsole.log("Hello",name)','}']

var editor = document.createElement('div')
editor.id = 'editor'
editor.className = 'hljs'

var ruler = document.createElement('span')
ruler.id = 'ruler'
editor.appendChild(ruler)

var content = document.createElement('div')
content.id = 'content'

var mousedown = false
content.onmousedown = function(e){
	mousedown = true

	var m = measureText('?')
	var n = Math.round((e.clientX-content.offsetLeft)/m)
	var target = e.target.classList.contains('line') ? e.target : e.target.parentNode
	var ln = Number(target.getAttribute('data-line'))
	caretpos.y = ln
	var s = code[ln];

	caretpos.x = n

	var match = s.match(/\t/g) || []
	var indexes = []
	for(var i = 0; i < match.length; i++){
		caretpos.x-=3
		s = s.split('')
		var index = s.indexOf('\t')
		indexes.push(index+i)
		s.splice(index,1)
		s = s.join('')
	}

	caretpos.x = Math.max(caretpos.x, 0)

	positioncaret()

	if(document.activeElement != textarea){
		textarea.focus()
	}
}
content.onmouseup = function(){
	mousedown = false
}
var mousemove = false
content.onmousemove = function(){
	if(mousedown){
		mousemove = true
	}
}
content.ondblclick = function(e){
	mousemove = true
}
content.onclick = function(e){
	setTimeout(function(){
		if(mousemove == false && document.activeElement != textarea){
			textarea.focus()
		}
		mousemove = false
	})
	
}
content.onfocus = function(){
	if(document.activeElement != textarea){
		textarea.focus()
	}
}

function positioncaret(){
	caret.style.left = measureText(code[caretpos.y].substr(0,Math.min(caretpos.x,code[caretpos.y].length)))+content.offsetLeft+'px'
	caret.style.top = caretpos.y*content.children[0].offsetHeight+content.offsetTop
	caret.classList.remove('blink')
	setTimeout(function(){
		caret.classList.add('blink')
	},0)
}

function render(){
	content.innerHTML = ''
	code.forEach(function(c,i){
		var line = document.createElement('div')
		line.setAttribute('data-line',i)
		line.className = 'line'
		var text = hljs.highlight('javascript', c).value
		text = text.replace(/\t/g,'<span class="tab">	</span>')
		if(text == ''){ text = ' ' }
		line.innerHTML = text
		content.appendChild(line)
	})
	content.appendChild(selectioncontainer)
}

editor.appendChild(content)

var textarea = document.createElement('textarea')
textarea.id = 'textarea'
textarea.wrap = 'off'
textarea.spellcheck = false


textarea.onkeydown = function(e){
	if(e.keyCode == 37){ // left
		caretpos.x -= 1
		if(caretpos.x < 0 && caretpos.y > 0){
			caretpos.x = code[caretpos.y-1].length
			caretpos.y -= 1
		}
	}
	if(e.keyCode == 38){ // up
		caretpos.y -= 1
	}
	if(e.keyCode == 39){ // right
		caretpos.x += 1
		if(caretpos.x > code[caretpos.y].length && caretpos.y < code.length-1){
			caretpos.x = 0
			caretpos.y += 1
		}
	}
	if(e.keyCode == 40){ // down
		caretpos.y += 1
	}
	if(e.keyCode == 8){ // delete
		if(caretpos.x > 0){
			code[caretpos.y] = splice(code[caretpos.y], caretpos.x-1, 1)
			caretpos.x -= 1
		}else if(caretpos.y > 0){
			caretpos.x = code[caretpos.y-1].length
			code[caretpos.y-1] += code[caretpos.y]
			code.splice(caretpos.y,1)
			caretpos.y -= 1
		}
	}

	positioncaret()
	render()
}
textarea.oninput = function(e){
	deleteselection()
	
	if(e.keyCode == 13){ // enter
		code.splice(caretpos.y+1, 0, code[caretpos.y].substr(caretpos.x))
		code[caretpos.y] = code[caretpos.y].substr(0, caretpos.x)
		caretpos.y += 1
		caretpos.x = 0
	}
	if(e.keyCode == 9){ // tab
		code[caretpos.y] = splice(code[caretpos.y], caretpos.x, 0, '	')
		caretpos.x += 1
	}
	caretpos.y = Math.max(Math.min(caretpos.y,code.length-1),0)


	if([37,38,39,40,8,13,9].indexOf(e.keyCode) == -1 ? true : false){
		var value = this.value.split('\n')
		code[caretpos.y] = splice(code[caretpos.y], caretpos.x, 0, value[0])
		if(value.length > 1){
			for(var i = 1; i < value.length; i++){
				code.splice(caretpos.y+1, 0, value[i])
				caretpos.y += 1
				caretpos.x = value[i].length
			}
		}else{
			caretpos.x += value[0].length
		}
		this.value = ''
	}

	positioncaret()
	render()
}
editor.appendChild(textarea)

var caret = document.createElement('div')
caret.id = "caret"
caret.className = "blink"
editor.appendChild(caret)

var selectioncontainer = document.createElement('div')
selectioncontainer.id = "selection"
content.appendChild(selectioncontainer)

document.body.appendChild(editor)


function measureText(t){
	ruler.innerHTML = t
	return ruler.offsetWidth
}

function deleteselection(){
	if(selecting){
		if(selection.start.y == selection.end.y){
			code[selection.start.y] = splice(code[selection.start.y], selection.start.x, selection.end.x - selection.start.x)
		}else{
			for(var i = selection.start.y; i <= selection.end.y;){
				if(i == selection.start.y){
					code[i] = code[i].substr(0,selection.start.x)
					i += 1
				}if(i != selection.end.y || selection.end.x == code[i].length){
					code.splice(i,1)
					selection.end.y -= 1
				}else{
					code[i-1] += splice(code[i],0,selection.end.x)
					code.splice(i,1)
					i += 1
				}
			}
		}

		caretpos.x = selection.start.x
		caretpos.y = selection.start.y
		selection.end.x = selection.start.x
		selection.end.y = selection.start.y
		//window.getSelection().collapse(0)
		if(document.activeElement != textarea){
			textarea.focus()
		}

		render()
		renderSelection()
		positioncaret()
	}	
}

window.onkeydown = function(e){
	if(selection && selection.start.x == selection.end.x && selection.start.y == selection.end.y){
		deleteselection()
	}

	if(e.keyCode == 8){ // delete
		e.preventDefault()
		deleteselection()
	}

	if(document.activeElement != textarea){
		textarea.focus()
	}
}
window.onkeyup = function(){
	if(document.activeElement != textarea){
		textarea.focus()
	}
}

/*function toArray(arr){
	var newarr = []
	for(var i = 0; i < arr.length; i++){
		newarr.push(arr[i])
	}
	return newarr
}*/

function renderSelection(){
	if(selection.start.x != selection.end.x || selection.start.y != selection.end.y){
		selectioncontainer.innerHTML = ''
		var start = selection.start;
		var end = selection.end;
		/*if(selection.start.y > selection.end.y){
			start = selection.end
			end = selection.start
		}*/
		//selection.start = start
		//selection.end = end
		for(var i = selection.start.y; i <= selection.end.y; i++){
			var highlight = document.createElement('div')
			highlight.className = 'selection'

			var lineheight = content.children[0].offsetHeight

			var left = i == selection.start.y ? measureText(code[selection.start.y].substr(0, selection.start.x)) : 0

			highlight.style.left = left
			highlight.style.top = i * lineheight
			highlight.style.width = selection.start.y == selection.end.y ? measureText(code[selection.start.y].substr(selection.start.x, selection.end.x-selection.start.x)) : (i != selection.end.y ? measureText(code[i]) - left : measureText(code[selection.end.y].substr(0,selection.end.x)))
			highlight.style.height = lineheight
			
			selectioncontainer.appendChild(highlight)
		}
	}else{
		selectioncontainer.innerHTML = ''
	}
}

setInterval(function(){
	var highlight = window.getSelection()
	if( highlight.rangeCount != 0 && highlight.baseNode != null && ( mousedown || highlight.isCollapsed == false ) ){
		selecting = true

		var range = highlight.getRangeAt(0)
		var start = range.startContainer
		var end   = range.endContainer

		var startParent = start.parentNode.classList.contains('line') ? start.parentNode : (start.parentNode.parentNode.classList.contains('line') ? start.parentNode.parentNode : start.parentNode.parentNode.parentNode)
		var endParent   =   end.parentNode.classList.contains('line') ?   end.parentNode :   (end.parentNode.parentNode.classList.contains('line') ?   end.parentNode.parentNode :   end.parentNode.parentNode.parentNode)

		if(startParent.classList == undefined || !endParent.classList == undefined){
			//deleteselection()
			return
		}

		var prev = {
			start:{x:selection.start.x, y:selection.start.y},
			end:{x:selection.end.x, y:selection.end.y}
		}

		selection.start.y = Number( startParent.getAttribute('data-line') )
		selection.end.y   = Number(   endParent.getAttribute('data-line') )
		
		selection.start.x = range.startOffset
		selection.end.x   = range.endOffset

		var sch = startParent.childNodes
		var ech =   endParent.childNodes

		var walker = document.createTreeWalker( startParent, NodeFilter.SHOW_TEXT, null, false );
	    var node;
	    while(node = walker.nextNode()) {
	    	if( node == start ){ break }
	    	selection.start.x += node.nodeValue.length
	    }

	    var walker = document.createTreeWalker( endParent, NodeFilter.SHOW_TEXT, null, false );
	    var node;
	    while(node = walker.nextNode()) {
	    	if( node == end ){ break }
	    	selection.end.x += node.nodeValue.length
	    }

	    if(prev.start.x != selection.start.x || prev.start.y != selection.start.y){
	    	caretpos.x = selection.start.x
	    	caretpos.y = selection.start.y
	    }
	    if(prev.end.x != selection.end.x || prev.end.y != selection.end.y){
	    	caretpos.x = selection.end.x
	    	caretpos.y = selection.end.y
	    }

	    if(mousedown){ positioncaret() }
		renderSelection()
	}else{
		selecting = false
		selection.end.x = selection.start.x
		selection.end.y = selection.start.y
		renderSelection()
	}
},10)

render()	

