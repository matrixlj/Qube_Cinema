using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;

namespace Qube.Utils.Managed.Graphics;

public static class ImageUtils
{
	public static Bitmap ScaleImage(byte[] imageData, double scalingFactor)
	{
		using MemoryStream stream = new MemoryStream(imageData);
		using Image image = Image.FromStream(stream);
		int width = (int)((double)image.Width * scalingFactor);
		int height = (int)((double)image.Height * scalingFactor);
		Bitmap bitmap = new Bitmap(width, height);
		using System.Drawing.Graphics graphics = System.Drawing.Graphics.FromImage(bitmap);
		graphics.SmoothingMode = SmoothingMode.AntiAlias;
		graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
		graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
		graphics.DrawImage(image, new Rectangle(0, 0, width, height));
		return bitmap;
	}
}
