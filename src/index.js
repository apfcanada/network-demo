import { select } from 'd3-selection'
import { json } from 'd3-fetch'
import { 
	forceSimulation, forceManyBody, forceLink,
	forceY, forceX
} from 'd3-force'
import { drag as d3Drag } from 'd3-drag'

import './basic.css'

const width = 500
const height = 500
const radius = 8

const API = 'https://www.asiapacific.ca/pgapi/public/jurisdiction.php'

select('svg#map')
	.attr('width',`${width}px`)
	.attr('height',`${height}px`)
	
json(`${API}?sisters`).then( response => {
	// alias
	const jurisdictions = response.jurisdictions
	const links = response.links
	
	// initialize with random locations
	jurisdictions.map( j => {
		j.x = Math.random()*width
		j.y = Math.random()*height
	} )
		
	// add direct references to links
	links.map( (l,i) => {
		l.uid = i 
		l.source = jurisdictions.find( j => j.geo_id == l.pair[0] )
		l.target = jurisdictions.find( j => j.geo_id == l.pair[1] )
	} )
		
	const simulation = forceSimulation(jurisdictions)
		.force("link", forceLink(links).id(d => d.uid).distance(20).strength(0.5))
		.force("charge", forceManyBody().strength(-50))
		.force("x", forceX(width/2))
		.force("y", forceY(height/2))
		
	let lines = select('svg#map')
		.selectAll('line')
		.data(links)
		.join('line')
	lines
		.attr('x1',l=>l.pair[0].x)
		.attr('x2',l=>l.pair[1].x)
		.attr('y1',l=>l.pair[0].y)
		.attr('y2',l=>l.pair[1].y)
			
	let circles = select('svg#map')
		.selectAll('circle')
		.data(jurisdictions)
		.join('circle')
	circles
		.attr('id',j=>j.geo_id)
		.attr('r',radius)
		.attr('class',j=>j.canadian ? 'canadian' : null)
		.attr('cx',j=>j.x)
		.attr('cy',j=>j.y)
		.call(drag(simulation))
		.append('title').text(d=>d.name.en)
			
	json(`${API}?geo_id=2&listDescendants`).then( canada => { 
		let cids = new Set( canada.descendants.map( cj => cj.geo_id ))
		jurisdictions.map( j => {
			if(cids.has(j.geo_id)) j.canadian = true			
		} )
		circles.attr('class',j=>j.canadian ? 'canadian' : null)
	} )
			
	simulation.on("tick", () => {
		lines
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);
		circles
			.attr("cx", d => d.x)
			.attr("cy", d => d.y);
	})
} )
	
function drag(simulation){

	function dragstarted(event) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		event.subject.fx = event.subject.x;
		event.subject.fy = event.subject.y;
	}
  
	function dragged(event) {
		event.subject.fx = event.x;
		event.subject.fy = event.y;
	}
  
	function dragended(event) {
		if (!event.active) simulation.alphaTarget(0);
		event.subject.fx = null;
		event.subject.fy = null;
	}
  
	return d3Drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended);
}
