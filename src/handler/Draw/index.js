import Basic from './Draw'
import { Polygon, polygon } from './DrawPolygon'
import { Line, line } from './DrawLine'
import { Circle, circle } from './DrawCircle'
import { Rectangle, rectangle } from './DrawRectangle'
import { Point, point } from './DrawPoint'
import { Text, text } from './DrawText'

Basic.Polygon = Polygon
Basic.Line = Line
Basic.Circle = Circle
Basic.Rectangle = Rectangle
Basic.Point = Point
Basic.Text = Text
Basic.Type = {
  POINT: 'point',
  POLYLINE: 'polyline',
  POLYGON: 'polygon',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  TEXT: 'text'
}
export const Draw = Basic
export const draw = {
  polygon, line, circle, rectangle, point, text
}
export default Draw