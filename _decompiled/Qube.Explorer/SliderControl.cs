using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace Qube.Explorer;

public class SliderControl : UserControl
{
	public delegate void RangeChangedEventHandler(object sender, EventArgs e);

	public delegate void RangeChangingEventHandler(object sender, EventArgs e);

	public enum ActiveMarkType
	{
		none,
		left,
		right
	}

	public enum RangeBarOrientation
	{
		horizontal,
		vertical
	}

	public enum TopBottomOrientation
	{
		top,
		bottom,
		both
	}

	private Container components;

	private Color colorInner = Color.Blue;

	private Color colorRange = Color.FromKnownColor(KnownColor.Control);

	private Color colorShadowLight = Color.FromKnownColor(KnownColor.ControlLightLight);

	private Color colorShadowDark = Color.FromKnownColor(KnownColor.ControlDarkDark);

	private int sizeShadow = 1;

	private double Minimum;

	private double Maximum = 10.0;

	private double rangeMin = 3.0;

	private double rangeMax = 5.0;

	private ActiveMarkType ActiveMark;

	private RangeBarOrientation orientationBar;

	private TopBottomOrientation orientationScale = TopBottomOrientation.bottom;

	private int BarHeight = 8;

	private int MarkWidth = 8;

	private int MarkHeight = 24;

	private int TickHeight = 6;

	private int numAxisDivision = 10;

	private int PosL;

	private int PosR;

	private int XPosMin;

	private int XPosMax;

	private Point[] LMarkPnt = new Point[5];

	private Point[] RMarkPnt = new Point[5];

	private bool MoveLMark;

	private bool MoveRMark;

	public int HeightOfTick
	{
		get
		{
			return TickHeight;
		}
		set
		{
			TickHeight = Math.Min(Math.Max(1, value), BarHeight);
			Invalidate();
			Update();
		}
	}

	public ActiveMarkType MarkType => ActiveMark;

	public int HeightOfMark
	{
		get
		{
			return MarkHeight;
		}
		set
		{
			MarkHeight = Math.Max(BarHeight + 2, value);
			Invalidate();
			Update();
		}
	}

	public int HeightOfBar
	{
		get
		{
			return BarHeight;
		}
		set
		{
			BarHeight = Math.Min(value, MarkHeight - 2);
			Invalidate();
			Update();
		}
	}

	public RangeBarOrientation Orientation
	{
		get
		{
			return orientationBar;
		}
		set
		{
			orientationBar = value;
			Invalidate();
			Update();
		}
	}

	public TopBottomOrientation ScaleOrientation
	{
		get
		{
			return orientationScale;
		}
		set
		{
			orientationScale = value;
			Invalidate();
			Update();
		}
	}

	public int RangeMaximum
	{
		get
		{
			return (int)rangeMax;
		}
		set
		{
			rangeMax = value;
			if (rangeMax < Minimum)
			{
				rangeMax = Minimum;
			}
			else if (rangeMax > Maximum)
			{
				rangeMax = Maximum;
			}
			if (rangeMax < rangeMin)
			{
				rangeMax = rangeMin;
			}
			Range2Pos();
			Invalidate(invalidateChildren: true);
		}
	}

	public int RangeMinimum
	{
		get
		{
			return (int)rangeMin;
		}
		set
		{
			rangeMin = value;
			if (rangeMin < Minimum)
			{
				rangeMin = Minimum;
			}
			else if (rangeMin > Maximum)
			{
				rangeMin = Maximum;
			}
			if (rangeMin > rangeMax)
			{
				rangeMin = rangeMax;
			}
			Range2Pos();
			Invalidate(invalidateChildren: true);
		}
	}

	public int TotalMaximum
	{
		get
		{
			return (int)Maximum;
		}
		set
		{
			Maximum = value;
			if (rangeMax > Maximum)
			{
				rangeMax = Maximum;
			}
			Range2Pos();
			Invalidate(invalidateChildren: true);
		}
	}

	public int TotalMinimum
	{
		get
		{
			return (int)Minimum;
		}
		set
		{
			Minimum = value;
			if (rangeMin < Minimum)
			{
				rangeMin = Minimum;
			}
			Range2Pos();
			Invalidate(invalidateChildren: true);
		}
	}

	public int DivisionNum
	{
		get
		{
			return numAxisDivision;
		}
		set
		{
			numAxisDivision = value;
			Refresh();
		}
	}

	public Color InnerColor
	{
		get
		{
			return colorInner;
		}
		set
		{
			colorInner = value;
			Refresh();
		}
	}

	public event RangeChangedEventHandler RangeChanged;

	public event RangeChangedEventHandler RangeChanging;

	public SliderControl()
	{
		InitializeComponent();
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		base.Name = "SliderControl";
		base.Size = new System.Drawing.Size(344, 64);
		base.KeyPress += new System.Windows.Forms.KeyPressEventHandler(OnKeyPress);
		base.Resize += new System.EventHandler(OnResize);
		base.Load += new System.EventHandler(OnLoad);
		base.SizeChanged += new System.EventHandler(OnSizeChanged);
		base.MouseUp += new System.Windows.Forms.MouseEventHandler(OnMouseUp);
		base.Paint += new System.Windows.Forms.PaintEventHandler(OnPaint);
		base.Leave += new System.EventHandler(OnLeave);
		base.MouseMove += new System.Windows.Forms.MouseEventHandler(OnMouseMove);
		base.MouseDown += new System.Windows.Forms.MouseEventHandler(OnMouseDown);
	}

	public void SelectRange(int left, int right)
	{
		RangeMinimum = left;
		RangeMaximum = right;
		Range2Pos();
		Invalidate(invalidateChildren: true);
	}

	public void SetRangeLimit(double left, double right)
	{
		Minimum = left;
		Maximum = right;
		Range2Pos();
		Invalidate(invalidateChildren: true);
	}

	private void OnPaint(object sender, PaintEventArgs e)
	{
		int num = base.Height;
		int num2 = base.Width;
		new Pen(colorRange);
		Pen pen = new Pen(colorShadowLight);
		Pen pen2 = new Pen(colorShadowDark);
		SolidBrush brush = new SolidBrush(colorShadowLight);
		SolidBrush brush2 = new SolidBrush(colorShadowDark);
		SolidBrush brush3 = new SolidBrush(colorRange);
		SolidBrush brush4 = ((!base.Enabled) ? new SolidBrush(Color.FromKnownColor(KnownColor.InactiveCaption)) : new SolidBrush(colorInner));
		XPosMin = MarkWidth + 1;
		if (orientationBar == RangeBarOrientation.horizontal)
		{
			XPosMax = num2 - MarkWidth - 1;
		}
		else
		{
			XPosMax = num - MarkWidth - 1;
		}
		if (PosL < XPosMin)
		{
			PosL = XPosMin;
		}
		if (PosL > XPosMax)
		{
			PosL = XPosMax;
		}
		if (PosR > XPosMax)
		{
			PosR = XPosMax;
		}
		if (PosR < XPosMin)
		{
			PosR = XPosMin;
		}
		Range2Pos();
		int num3;
		int num4;
		int num5;
		int num6;
		if (orientationBar == RangeBarOrientation.horizontal)
		{
			num3 = (num - BarHeight) / 2;
			num4 = num3 + (BarHeight - MarkHeight) / 2 - 1;
			e.Graphics.FillRectangle(brush2, 0, num3, num2 - 1, sizeShadow);
			e.Graphics.FillRectangle(brush2, 0, num3, sizeShadow, BarHeight - 1);
			e.Graphics.FillRectangle(brush, 0, num3 + BarHeight - 1 - sizeShadow, num2 - 1, sizeShadow);
			e.Graphics.FillRectangle(brush, num2 - 1 - sizeShadow, num3, sizeShadow, BarHeight - 1);
			e.Graphics.FillRectangle(brush4, PosL, num3 + sizeShadow, PosR - PosL, BarHeight - 1 - 2 * sizeShadow);
			if (orientationScale == TopBottomOrientation.bottom)
			{
				num5 = (num6 = num3 + BarHeight + 2);
			}
			else if (orientationScale == TopBottomOrientation.top)
			{
				num5 = (num6 = num3 - TickHeight - 4);
			}
			else
			{
				num5 = num3 + BarHeight + 2;
				num6 = num3 - TickHeight - 4;
			}
			if (numAxisDivision > 1)
			{
				double num7 = (double)(XPosMax - XPosMin) / (double)numAxisDivision;
				for (int i = 0; i < numAxisDivision + 1; i++)
				{
					int num8 = (int)Math.Round((double)i * num7);
					if (orientationScale == TopBottomOrientation.bottom || orientationScale == TopBottomOrientation.both)
					{
						e.Graphics.DrawLine(pen2, MarkWidth + 1 + num8, num5, MarkWidth + 1 + num8, num5 + TickHeight);
					}
					if (orientationScale == TopBottomOrientation.top || orientationScale == TopBottomOrientation.both)
					{
						e.Graphics.DrawLine(pen2, MarkWidth + 1 + num8, num6, MarkWidth + 1 + num8, num6 + TickHeight);
					}
				}
			}
			LMarkPnt[0].X = PosL - MarkWidth;
			LMarkPnt[0].Y = num4 + MarkHeight / 3;
			LMarkPnt[1].X = PosL;
			LMarkPnt[1].Y = num4;
			LMarkPnt[2].X = PosL;
			LMarkPnt[2].Y = num4 + MarkHeight;
			LMarkPnt[3].X = PosL - MarkWidth;
			LMarkPnt[3].Y = num4 + 2 * MarkHeight / 3;
			LMarkPnt[4].X = PosL - MarkWidth;
			LMarkPnt[4].Y = num4;
			e.Graphics.FillPolygon(brush3, LMarkPnt);
			e.Graphics.DrawLine(pen2, LMarkPnt[3].X - 1, LMarkPnt[3].Y, LMarkPnt[1].X - 1, LMarkPnt[2].Y);
			e.Graphics.DrawLine(pen, LMarkPnt[0].X - 1, LMarkPnt[0].Y, LMarkPnt[0].X - 1, LMarkPnt[3].Y);
			e.Graphics.DrawLine(pen, LMarkPnt[0].X - 1, LMarkPnt[0].Y, LMarkPnt[1].X - 1, LMarkPnt[1].Y);
			if (PosL < PosR)
			{
				e.Graphics.DrawLine(pen2, LMarkPnt[1].X, LMarkPnt[1].Y + 1, LMarkPnt[1].X, LMarkPnt[2].Y);
			}
			if (ActiveMark == ActiveMarkType.left)
			{
				e.Graphics.DrawLine(pen, PosL - MarkWidth / 2 - 1, num4 + MarkHeight / 3, PosL - MarkWidth / 2 - 1, num4 + 2 * MarkHeight / 3);
				e.Graphics.DrawLine(pen2, PosL - MarkWidth / 2, num4 + MarkHeight / 3, PosL - MarkWidth / 2, num4 + 2 * MarkHeight / 3);
			}
			RMarkPnt[0].X = PosR + MarkWidth;
			RMarkPnt[0].Y = num4 + MarkHeight / 3;
			RMarkPnt[1].X = PosR;
			RMarkPnt[1].Y = num4;
			RMarkPnt[2].X = PosR;
			RMarkPnt[2].Y = num4 + MarkHeight;
			RMarkPnt[3].X = PosR + MarkWidth;
			RMarkPnt[3].Y = num4 + 2 * MarkHeight / 3;
			RMarkPnt[4].X = PosR + MarkWidth;
			RMarkPnt[4].Y = num4;
			e.Graphics.FillPolygon(brush3, RMarkPnt);
			if (PosL < PosR)
			{
				e.Graphics.DrawLine(pen, RMarkPnt[1].X - 1, RMarkPnt[1].Y + 1, RMarkPnt[2].X - 1, RMarkPnt[2].Y);
			}
			e.Graphics.DrawLine(pen2, RMarkPnt[2].X, RMarkPnt[2].Y, RMarkPnt[3].X, RMarkPnt[3].Y);
			e.Graphics.DrawLine(pen2, RMarkPnt[0].X, RMarkPnt[0].Y, RMarkPnt[1].X, RMarkPnt[1].Y);
			e.Graphics.DrawLine(pen2, RMarkPnt[0].X, RMarkPnt[0].Y + 1, RMarkPnt[3].X, RMarkPnt[3].Y);
			if (ActiveMark == ActiveMarkType.right)
			{
				e.Graphics.DrawLine(pen, PosR + MarkWidth / 2 - 1, num4 + MarkHeight / 3, PosR + MarkWidth / 2 - 1, num4 + 2 * MarkHeight / 3);
				e.Graphics.DrawLine(pen2, PosR + MarkWidth / 2, num4 + MarkHeight / 3, PosR + MarkWidth / 2, num4 + 2 * MarkHeight / 3);
			}
			if (MoveLMark)
			{
				Font font = new Font("Arial", MarkWidth);
				SolidBrush brush5 = new SolidBrush(colorShadowDark);
				StringFormat stringFormat = new StringFormat();
				stringFormat.Alignment = StringAlignment.Center;
				stringFormat.LineAlignment = StringAlignment.Near;
				e.Graphics.DrawString(rangeMin.ToString(), font, brush5, PosL, num5 + TickHeight, stringFormat);
			}
			if (MoveRMark)
			{
				Font font2 = new Font("Arial", MarkWidth);
				SolidBrush brush6 = new SolidBrush(colorShadowDark);
				StringFormat stringFormat2 = new StringFormat();
				stringFormat2.Alignment = StringAlignment.Center;
				stringFormat2.LineAlignment = StringAlignment.Near;
				e.Graphics.DrawString(rangeMax.ToString(), font2, brush6, PosR, num5 + TickHeight, stringFormat2);
			}
			return;
		}
		num3 = (num2 + BarHeight) / 2;
		num4 = num3 - BarHeight / 2 - MarkHeight / 2;
		if (orientationScale == TopBottomOrientation.bottom)
		{
			num5 = (num6 = num3 + 2);
		}
		else if (orientationScale == TopBottomOrientation.top)
		{
			num5 = (num6 = num3 - BarHeight - 2 - TickHeight);
		}
		else
		{
			num5 = num3 + 2;
			num6 = num3 - BarHeight - 2 - TickHeight;
		}
		e.Graphics.FillRectangle(brush2, num3 - BarHeight, 0, BarHeight, sizeShadow);
		e.Graphics.FillRectangle(brush2, num3 - BarHeight, 0, sizeShadow, num - 1);
		e.Graphics.FillRectangle(brush, num3, 0, sizeShadow, num - 1);
		e.Graphics.FillRectangle(brush, num3 - BarHeight, num - sizeShadow, BarHeight, sizeShadow);
		e.Graphics.FillRectangle(brush4, num3 - BarHeight + sizeShadow, PosL, BarHeight - 2 * sizeShadow, PosR - PosL);
		if (numAxisDivision > 1)
		{
			double num7 = (double)(XPosMax - XPosMin) / (double)numAxisDivision;
			for (int j = 0; j < numAxisDivision + 1; j++)
			{
				int num8 = (int)Math.Round((double)j * num7);
				if (orientationScale == TopBottomOrientation.bottom || orientationScale == TopBottomOrientation.both)
				{
					e.Graphics.DrawLine(pen2, num5, MarkWidth + 1 + num8, num5 + TickHeight, MarkWidth + 1 + num8);
				}
				if (orientationScale == TopBottomOrientation.top || orientationScale == TopBottomOrientation.both)
				{
					e.Graphics.DrawLine(pen2, num6, MarkWidth + 1 + num8, num6 + TickHeight, MarkWidth + 1 + num8);
				}
			}
		}
		LMarkPnt[0].Y = PosL - MarkWidth;
		LMarkPnt[0].X = num4 + MarkHeight / 3;
		LMarkPnt[1].Y = PosL;
		LMarkPnt[1].X = num4;
		LMarkPnt[2].Y = PosL;
		LMarkPnt[2].X = num4 + MarkHeight;
		LMarkPnt[3].Y = PosL - MarkWidth;
		LMarkPnt[3].X = num4 + 2 * MarkHeight / 3;
		LMarkPnt[4].Y = PosL - MarkWidth;
		LMarkPnt[4].X = num4;
		e.Graphics.FillPolygon(brush3, LMarkPnt);
		e.Graphics.DrawLine(pen2, LMarkPnt[3].X, LMarkPnt[3].Y, LMarkPnt[2].X, LMarkPnt[2].Y);
		e.Graphics.DrawLine(pen, LMarkPnt[0].X - 1, LMarkPnt[0].Y, LMarkPnt[3].X - 1, LMarkPnt[3].Y);
		e.Graphics.DrawLine(pen, LMarkPnt[0].X - 1, LMarkPnt[0].Y, LMarkPnt[1].X - 1, LMarkPnt[1].Y);
		if (PosL < PosR)
		{
			e.Graphics.DrawLine(pen2, LMarkPnt[1].X, LMarkPnt[1].Y, LMarkPnt[2].X, LMarkPnt[2].Y);
		}
		if (ActiveMark == ActiveMarkType.left)
		{
			e.Graphics.DrawLine(pen, num4 + MarkHeight / 3, PosL - MarkWidth / 2, num4 + 2 * MarkHeight / 3, PosL - MarkWidth / 2);
			e.Graphics.DrawLine(pen2, num4 + MarkHeight / 3, PosL - MarkWidth / 2 + 1, num4 + 2 * MarkHeight / 3, PosL - MarkWidth / 2 + 1);
		}
		RMarkPnt[0].Y = PosR + MarkWidth;
		RMarkPnt[0].X = num4 + MarkHeight / 3;
		RMarkPnt[1].Y = PosR;
		RMarkPnt[1].X = num4;
		RMarkPnt[2].Y = PosR;
		RMarkPnt[2].X = num4 + MarkHeight;
		RMarkPnt[3].Y = PosR + MarkWidth;
		RMarkPnt[3].X = num4 + 2 * MarkHeight / 3;
		RMarkPnt[4].Y = PosR + MarkWidth;
		RMarkPnt[4].X = num4;
		e.Graphics.FillPolygon(brush3, RMarkPnt);
		e.Graphics.DrawLine(pen2, RMarkPnt[2].X, RMarkPnt[2].Y, RMarkPnt[3].X, RMarkPnt[3].Y);
		e.Graphics.DrawLine(pen2, RMarkPnt[0].X, RMarkPnt[0].Y, RMarkPnt[1].X, RMarkPnt[1].Y);
		e.Graphics.DrawLine(pen2, RMarkPnt[0].X, RMarkPnt[0].Y, RMarkPnt[3].X, RMarkPnt[3].Y);
		if (PosL < PosR)
		{
			e.Graphics.DrawLine(pen, RMarkPnt[1].X, RMarkPnt[1].Y, RMarkPnt[2].X, RMarkPnt[2].Y);
		}
		if (ActiveMark == ActiveMarkType.right)
		{
			e.Graphics.DrawLine(pen, num4 + MarkHeight / 3, PosR + MarkWidth / 2 - 1, num4 + 2 * MarkHeight / 3, PosR + MarkWidth / 2 - 1);
			e.Graphics.DrawLine(pen2, num4 + MarkHeight / 3, PosR + MarkWidth / 2, num4 + 2 * MarkHeight / 3, PosR + MarkWidth / 2);
		}
		if (MoveLMark)
		{
			Font font3 = new Font("Arial", MarkWidth);
			SolidBrush brush7 = new SolidBrush(colorShadowDark);
			StringFormat stringFormat3 = new StringFormat();
			stringFormat3.Alignment = StringAlignment.Near;
			stringFormat3.LineAlignment = StringAlignment.Center;
			e.Graphics.DrawString(rangeMin.ToString(), font3, brush7, num5 + TickHeight + 2, PosL, stringFormat3);
		}
		if (MoveRMark)
		{
			Font font4 = new Font("Arial", MarkWidth);
			SolidBrush brush8 = new SolidBrush(colorShadowDark);
			StringFormat stringFormat4 = new StringFormat();
			stringFormat4.Alignment = StringAlignment.Near;
			stringFormat4.LineAlignment = StringAlignment.Center;
			e.Graphics.DrawString(rangeMax.ToString(), font4, brush8, num5 + TickHeight, PosR, stringFormat4);
		}
	}

	private void OnMouseDown(object sender, MouseEventArgs e)
	{
		if (base.Enabled)
		{
			Rectangle rectangle = new Rectangle(Math.Min(LMarkPnt[0].X, LMarkPnt[1].X), Math.Min(LMarkPnt[0].Y, LMarkPnt[3].Y), Math.Abs(LMarkPnt[2].X - LMarkPnt[0].X), Math.Max(Math.Abs(LMarkPnt[0].Y - LMarkPnt[3].Y), Math.Abs(LMarkPnt[0].Y - LMarkPnt[1].Y)));
			Rectangle rectangle2 = new Rectangle(Math.Min(RMarkPnt[0].X, RMarkPnt[2].X), Math.Min(RMarkPnt[0].Y, RMarkPnt[1].Y), Math.Abs(RMarkPnt[0].X - RMarkPnt[2].X), Math.Max(Math.Abs(RMarkPnt[2].Y - RMarkPnt[0].Y), Math.Abs(RMarkPnt[1].Y - RMarkPnt[0].Y)));
			if (rectangle.Contains(e.X, e.Y))
			{
				base.Capture = true;
				MoveLMark = true;
				ActiveMark = ActiveMarkType.left;
				Invalidate(invalidateChildren: true);
			}
			if (rectangle2.Contains(e.X, e.Y))
			{
				base.Capture = true;
				MoveRMark = true;
				ActiveMark = ActiveMarkType.right;
				Invalidate(invalidateChildren: true);
			}
		}
	}

	private void OnMouseUp(object sender, MouseEventArgs e)
	{
		if (base.Enabled)
		{
			base.Capture = false;
			MoveLMark = false;
			MoveRMark = false;
			Invalidate();
			OnRangeChanged(EventArgs.Empty);
		}
	}

	private void OnMouseMove(object sender, MouseEventArgs e)
	{
		if (!base.Enabled)
		{
			return;
		}
		_ = base.Height;
		int num = base.Width;
		_ = rangeMin * (double)num / (Maximum - Minimum);
		_ = rangeMax * (double)num / (Maximum - Minimum);
		Rectangle rectangle = new Rectangle(Math.Min(LMarkPnt[0].X, LMarkPnt[1].X), Math.Min(LMarkPnt[0].Y, LMarkPnt[3].Y), Math.Abs(LMarkPnt[2].X - LMarkPnt[0].X), Math.Max(Math.Abs(LMarkPnt[0].Y - LMarkPnt[3].Y), Math.Abs(LMarkPnt[0].Y - LMarkPnt[1].Y)));
		Rectangle rectangle2 = new Rectangle(Math.Min(RMarkPnt[0].X, RMarkPnt[2].X), Math.Min(RMarkPnt[0].Y, RMarkPnt[1].Y), Math.Abs(RMarkPnt[0].X - RMarkPnt[2].X), Math.Max(Math.Abs(RMarkPnt[2].Y - RMarkPnt[0].Y), Math.Abs(RMarkPnt[1].Y - RMarkPnt[0].Y)));
		if (rectangle.Contains(e.X, e.Y) || rectangle2.Contains(e.X, e.Y))
		{
			if (orientationBar == RangeBarOrientation.horizontal)
			{
				Cursor = Cursors.SizeWE;
			}
			else
			{
				Cursor = Cursors.SizeNS;
			}
		}
		else
		{
			Cursor = Cursors.Arrow;
		}
		if (MoveLMark)
		{
			if (orientationBar == RangeBarOrientation.horizontal)
			{
				Cursor = Cursors.SizeWE;
			}
			else
			{
				Cursor = Cursors.SizeNS;
			}
			if (orientationBar == RangeBarOrientation.horizontal)
			{
				PosL = e.X;
			}
			else
			{
				PosL = e.Y;
			}
			if (PosL < XPosMin)
			{
				PosL = XPosMin;
			}
			if (PosL > XPosMax)
			{
				PosL = XPosMax;
			}
			if (PosR < PosL)
			{
				PosR = PosL;
			}
			Pos2Range();
			ActiveMark = ActiveMarkType.left;
			Invalidate(invalidateChildren: true);
			OnRangeChanging(EventArgs.Empty);
		}
		else if (MoveRMark)
		{
			if (orientationBar == RangeBarOrientation.horizontal)
			{
				Cursor = Cursors.SizeWE;
			}
			else
			{
				Cursor = Cursors.SizeNS;
			}
			if (orientationBar == RangeBarOrientation.horizontal)
			{
				PosR = e.X;
			}
			else
			{
				PosR = e.Y;
			}
			if (PosR > XPosMax)
			{
				PosR = XPosMax;
			}
			if (PosR < XPosMin)
			{
				PosR = XPosMin;
			}
			if (PosL > PosR)
			{
				PosL = PosR;
			}
			Pos2Range();
			ActiveMark = ActiveMarkType.right;
			Invalidate(invalidateChildren: true);
			OnRangeChanging(EventArgs.Empty);
		}
	}

	private void Pos2Range()
	{
		int num = ((orientationBar != RangeBarOrientation.horizontal) ? base.Height : base.Width);
		int num2 = num - 2 * MarkWidth - 2;
		rangeMin = Minimum + (double)(int)Math.Round((Maximum - Minimum) * (double)(PosL - XPosMin) / (double)num2);
		rangeMax = Minimum + (double)(int)Math.Round((Maximum - Minimum) * (double)(PosR - XPosMin) / (double)num2);
	}

	private void Range2Pos()
	{
		int num = ((orientationBar != RangeBarOrientation.horizontal) ? base.Height : base.Width);
		int num2 = num - 2 * MarkWidth - 2;
		PosL = XPosMin + (int)Math.Round((double)num2 * (rangeMin - Minimum) / (Maximum - Minimum));
		PosR = XPosMin + (int)Math.Round((double)num2 * (rangeMax - Minimum) / (Maximum - Minimum));
	}

	private void OnResize(object sender, EventArgs e)
	{
		Invalidate(invalidateChildren: true);
	}

	private void OnKeyPress(object sender, KeyPressEventArgs e)
	{
		if (!base.Enabled)
		{
			return;
		}
		if (ActiveMark == ActiveMarkType.left)
		{
			if (e.KeyChar == '+')
			{
				rangeMin += 1.0;
				if (rangeMin > Maximum)
				{
					rangeMin = Maximum;
				}
				if (rangeMax < rangeMin)
				{
					rangeMax = rangeMin;
				}
				OnRangeChanged(EventArgs.Empty);
			}
			else if (e.KeyChar == '-')
			{
				rangeMin -= 1.0;
				if (rangeMin < Minimum)
				{
					rangeMin = Minimum;
				}
				OnRangeChanged(EventArgs.Empty);
			}
		}
		else if (ActiveMark == ActiveMarkType.right)
		{
			if (e.KeyChar == '+')
			{
				rangeMax += 1.0;
				if (rangeMax > Maximum)
				{
					rangeMax = Maximum;
				}
				OnRangeChanged(EventArgs.Empty);
			}
			else if (e.KeyChar == '-')
			{
				rangeMax -= 1.0;
				if (rangeMax < Minimum)
				{
					rangeMax = Minimum;
				}
				if (rangeMax < rangeMin)
				{
					rangeMin = rangeMax;
				}
				OnRangeChanged(EventArgs.Empty);
			}
		}
		Invalidate(invalidateChildren: true);
	}

	private void OnLoad(object sender, EventArgs e)
	{
		SetStyle(ControlStyles.DoubleBuffer, value: true);
		SetStyle(ControlStyles.AllPaintingInWmPaint, value: true);
		SetStyle(ControlStyles.UserPaint, value: true);
	}

	private void OnSizeChanged(object sender, EventArgs e)
	{
		Invalidate(invalidateChildren: true);
		Update();
	}

	private void OnLeave(object sender, EventArgs e)
	{
		ActiveMark = ActiveMarkType.none;
	}

	public virtual void OnRangeChanged(EventArgs e)
	{
		if (this.RangeChanged != null)
		{
			this.RangeChanged(this, e);
		}
	}

	public virtual void OnRangeChanging(EventArgs e)
	{
		if (this.RangeChanging != null)
		{
			this.RangeChanging(this, e);
		}
	}
}
