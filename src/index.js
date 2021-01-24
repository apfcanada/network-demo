import { select } from 'd3-selection'
import { json } from 'd3-fetch'
import { 
	forceSimulation, 
	forceManyBody,
	forceY,
	forceX,
	forceLink
} from 'd3-force'

import './basic.css'

const width = 500
const height = 500
const radius = 8

select('svg#map')
	.attr('width',`${width}px`)
	.attr('height',`${height}px`)
	
json('https://www.asiapacific.ca/pgapi/public/jurisdiction.php?sisters')
	.then( response => {
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
			.attr('cx',j=>j.x)
			.attr('cy',j=>j.y)
			.append('title').text(d=>d.name.en)

		const simulation = forceSimulation(jurisdictions)
			.force("link", forceLink(links).id(d => d.uid).distance(20).strength(0.5))
			.force("charge", forceManyBody().strength(-50))
			.force("x", forceX(width/2))
			.force("y", forceY(height/2))
			
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
	
	
function parseLinks(sisters){
	// process links
	let pairs = new Set()
	// links are strings of the two geo_id's with the lower coming first
	sisters.map( j => {
		j.links.map( sis_id => {
			let ids = j.geo_id < sis_id ? [j.geo_id,sis_id] : [sis_id,j.geo_id]
			pairs.add(ids.join(','))
		})
	} ) 
	// replace strings with object references
	return [...pairs].map( link_csv => {
		let ids = link_csv.split(',')
		return [
			sisters.find( j => j.geo_id == ids[0] ),
			sisters.find( j => j.geo_id == ids[1] )
		]
	} )
}
