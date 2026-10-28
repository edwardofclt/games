import AppKit

let size = NSSize(width: 1024, height: 1024)
let colorSpace = CGColorSpaceCreateDeviceRGB()
let canvas = CGContext(data: nil, width: 1024, height: 1024, bitsPerComponent: 8,
                       bytesPerRow: 4096, space: colorSpace,
                       bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(cgContext: canvas, flipped: false)
NSGradient(starting: NSColor(calibratedRed: 0.83, green: 0.76, blue: 0.98, alpha: 1),
           ending: NSColor(calibratedRed: 0.65, green: 0.51, blue: 0.85, alpha: 1))!.draw(in: NSRect(origin: .zero, size: size), angle: -70)
func jelly(_ rect: NSRect, _ color: NSColor, rotation: CGFloat) {
    NSGraphicsContext.saveGraphicsState()
    let transform = AffineTransform(translationByX: rect.midX, byY: rect.midY)
    (transform as NSAffineTransform).concat()
    let rotate = NSAffineTransform(); rotate.rotate(byDegrees: rotation); rotate.concat()
    let r = NSRect(x: -rect.width / 2, y: -rect.height / 2, width: rect.width, height: rect.height)
    let shadow = NSShadow(); shadow.shadowColor = NSColor(calibratedRed: 0.24, green: 0.12, blue: 0.4, alpha: 0.24); shadow.shadowBlurRadius = 23; shadow.shadowOffset = NSSize(width: 0, height: -20); shadow.set()
    let path = NSBezierPath(roundedRect: r, xRadius: 45, yRadius: 45)
    NSGradient(starting: color.blended(withFraction: 0.20, of: .white)!, ending: color)!.draw(in: path, angle: -90)
    NSShadow().set()
    let inset = NSBezierPath(roundedRect: r.insetBy(dx: 14, dy: 13), xRadius: 32, yRadius: 32)
    NSColor.white.withAlphaComponent(0.24).setStroke(); inset.lineWidth = 10; inset.stroke()
    NSGraphicsContext.restoreGraphicsState()
}
let platform = NSBezierPath(roundedRect: NSRect(x: 160, y: 174, width: 704, height: 46), xRadius: 23, yRadius: 23)
NSColor(calibratedRed: 0.29, green: 0.20, blue: 0.44, alpha: 1).setFill(); platform.fill()
jelly(NSRect(x: 256, y: 220, width: 490, height: 150), NSColor(calibratedRed: 1, green: 0.57, blue: 0.47, alpha: 1), rotation: -2)
jelly(NSRect(x: 300, y: 383, width: 490, height: 150), NSColor(calibratedRed: 1, green: 0.90, blue: 0.24, alpha: 1), rotation: 4)
jelly(NSRect(x: 236, y: 552, width: 490, height: 150), NSColor(calibratedRed: 0.28, green: 0.94, blue: 0.73, alpha: 1), rotation: -4)
// A small fourth block in flight makes the mechanic recognizable at icon size.
jelly(NSRect(x: 325, y: 762, width: 380, height: 124), NSColor(calibratedRed: 0.60, green: 0.39, blue: 0.96, alpha: 1), rotation: 2)
NSGraphicsContext.current?.flushGraphics()
NSGraphicsContext.restoreGraphicsState()
let bitmap = NSBitmapImageRep(cgImage: canvas.makeImage()!)
guard let corner = bitmap.colorAt(x: 32, y: 32)?.usingColorSpace(.deviceRGB),
      let middle = bitmap.colorAt(x: 512, y: 512)?.usingColorSpace(.deviceRGB),
      corner.blueComponent > 0.4, middle.greenComponent > 0.5 else {
    fatalError("Icon renderer produced a blank or unexpected image")
}
let data = bitmap.representation(using: .png, properties: [:])!
let script = URL(fileURLWithPath: #filePath)
try data.write(to: script.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("App/Assets.xcassets/AppIcon.appiconset/AppIcon.png"))
