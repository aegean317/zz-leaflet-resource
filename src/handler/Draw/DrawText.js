import Draw from './Draw'
export class Text extends Draw {
	constructor(map, options) {
		super(map)
		this.options = options
		this.type = 'text'
	}
	_mouseDown(e) {
		this.deactivate()
		this.feature = L.text(e.latlng || e._latlng, null, this.options).addTo(this.layer)
		this.feature.enableEdit(feature => {
			this.finishedCallback && this.finishedCallback(feature, this.layer)
		})
	}
	deactivate() {
		this.active = false
		this.map.off('click', this._mouseDown, this)
	}
}
export function text(map, options) {
	return new Text(map, options)
}
export default text
