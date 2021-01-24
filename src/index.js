import { select } from 'd3-selection'
import { json } from 'd3-fetch'

import './basic.css'

const width = 500
const height = 500
const radius = 8

select('svg#map')
	.attr('width',`${width}px`)
	.attr('height',`${height}px`)
	
json('https://www.asiapacific.ca/pgapi/public/jurisdiction.php?sisters')
	.then( response => {
		response.map( j => {
			j.x = Math.random()*width
			j.y = Math.random()*height
		} )
		
		const links = parseLinks(response)
		let lines = select('svg#map')
			.selectAll('line')
			.data(links)
			.join('line')
		lines
			.attr('x1',l=>l[0].x)
			.attr('x2',l=>l[1].x)
			.attr('y1',l=>l[0].y)
			.attr('y2',l=>l[1].y)
			
		let circles = select('svg#map')
			.selectAll('circle')
			.data(response)
			.join('circle')
		circles
			.attr('id',d=>d.geo_id)
			.attr('r',radius)
			.attr('cx',j=>j.x)
			.attr('cy',j=>j.y)
			.append('title').text(d=>d.name_en)
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
