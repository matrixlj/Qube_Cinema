using System;
using System.Collections;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Design;
using System.Drawing.Text;
using System.Windows.Forms;

namespace MenuExtender;

[ProvideProperty("ExtEnable", typeof(MenuItem))]
[ProvideProperty("ImageIndex", typeof(MenuItem))]
public class MenuExtender : Component, IExtenderProvider
{
	private class Properties
	{
		public bool ExtEnable;

		public int ExtImageIndex;

		public Properties()
		{
			ExtEnable = false;
			ExtImageIndex = -1;
		}
	}

	private class MenuHelper
	{
		private const int SEPERATOR_HEIGHT = 8;

		private const int BORDER_VERTICAL = 2;

		private const int LEFT_MARGIN = 4;

		private const int RIGHT_MARGIN = 6;

		private const int SHORTCUT_MARGIN = 20;

		private const int ARROW_MARGIN = 12;

		private const int BULLET_DIAMETER = 7;

		private MenuExtender extender;

		private MenuItem menuItem;

		private Size iconSize;

		private Font menuFont;

		private Graphics gfx;

		public string ShortcutText
		{
			get
			{
				if (menuItem.ShowShortcut && menuItem.Shortcut != Shortcut.None)
				{
					Keys shortcut = (Keys)menuItem.Shortcut;
					return Convert.ToChar(Keys.Tab) + TypeDescriptor.GetConverter(shortcut.GetType()).ConvertToString(shortcut);
				}
				return null;
			}
		}

		public Font CurrentFont
		{
			get
			{
				if (menuItem.DefaultItem)
				{
					try
					{
						return new Font(menuFont, menuFont.Style | FontStyle.Bold);
					}
					catch
					{
						return menuFont;
					}
				}
				return menuFont;
			}
			set
			{
				CurrentFont = value;
			}
		}

		public MenuHelper(MenuItem item, Graphics graphics, MenuExtender ext)
		{
			menuItem = item;
			extender = ext;
			iconSize = ((ext.imageList == null) ? SystemInformation.SmallIconSize : ext.imageList.ImageSize);
			menuFont = ((ext.useSystemFont || ext.menuFont == null) ? SystemInformation.MenuFont : ext.menuFont);
			gfx = graphics;
		}

		public int CalcHeight()
		{
			if (IsSeperator())
			{
				return 8;
			}
			int num = ((menuFont.Height > iconSize.Height) ? menuFont.Height : iconSize.Height);
			return num + 2;
		}

		public int CalcWidth()
		{
			StringFormat stringFormat = new StringFormat();
			stringFormat.HotkeyPrefix = HotkeyPrefix.Show;
			int num = (int)Math.Ceiling(gfx.MeasureString(menuItem.Text, CurrentFont, 1000, stringFormat).Width);
			int num2 = (int)Math.Ceiling(gfx.MeasureString(ShortcutText, CurrentFont, 1000, stringFormat).Width);
			int num3 = (menuItem.IsParent ? 12 : 0);
			if (IsTopLevel())
			{
				return num;
			}
			return 4 + iconSize.Width + 6 + num + 20 + num2 + num3;
		}

		public bool HasShortcut()
		{
			if (menuItem.ShowShortcut)
			{
				return menuItem.Shortcut != Shortcut.None;
			}
			return false;
		}

		public bool IsSeperator()
		{
			return menuItem.Text == "-";
		}

		public bool IsTopLevel()
		{
			return menuItem.Parent is MainMenu;
		}

		public SolidBrush CurrentBrush(bool selected)
		{
			if (!menuItem.Enabled)
			{
				return new SolidBrush(SystemColors.GrayText);
			}
			SolidBrush solidBrush = null;
			if (selected)
			{
				return new SolidBrush(SystemColors.HighlightText);
			}
			return new SolidBrush(SystemColors.MenuText);
		}

		public void DrawBackground(Rectangle bounds, bool selected)
		{
			if (selected)
			{
				gfx.FillRectangle(SystemBrushes.Highlight, bounds);
			}
			else
			{
				gfx.FillRectangle(SystemBrushes.Menu, bounds);
			}
		}

		public void DrawMenu(Rectangle bounds, bool selected, int indexValue)
		{
			DrawMenuText(bounds, selected);
			if (menuItem.Checked)
			{
				DrawCheckBox(bounds, selected);
			}
			else if (indexValue > -1)
			{
				Image menuImage = extender.imageList.Images[indexValue];
				DrawImage(menuImage, bounds);
			}
		}

		public void DrawSeperator(Rectangle bounds)
		{
			Pen pen = new Pen(SystemColors.ControlDark);
			int num = bounds.Top + bounds.Height / 2;
			gfx.DrawLine(pen, bounds.Left, num, bounds.Left + bounds.Width, num);
		}

		private void DrawMenuText(Rectangle bounds, bool selected)
		{
			SolidBrush brush = CurrentBrush(selected);
			StringFormat stringFormat = new StringFormat();
			stringFormat.HotkeyPrefix = HotkeyPrefix.Show;
			int num = bounds.Top + (bounds.Height - CurrentFont.Height) / 2;
			gfx.DrawString(menuItem.Text, CurrentFont, brush, bounds.Left + 4 + iconSize.Width + 6, num, stringFormat);
			if (!IsTopLevel() && HasShortcut())
			{
				stringFormat.FormatFlags |= StringFormatFlags.DirectionRightToLeft;
				gfx.DrawString(ShortcutText, CurrentFont, brush, bounds.Width - 12, num, stringFormat);
			}
		}

		private void DrawCheckBox(Rectangle bounds, bool selected)
		{
			Rectangle rect = new Rectangle(bounds.Left, bounds.Top, SystemInformation.MenuCheckSize.Width, SystemInformation.MenuCheckSize.Height);
			rect.X += (4 + iconSize.Width + 6 - rect.Width) / 2;
			rect.Y += (bounds.Height - rect.Height) / 2;
			if (menuItem.RadioCheck)
			{
				DrawBullet(rect, selected);
			}
			else
			{
				DrawCheckMark(rect, selected);
			}
		}

		private void DrawBullet(Rectangle rect, bool selected)
		{
			SolidBrush brush = CurrentBrush(selected);
			int x = rect.Left + (rect.Width - 7) / 2;
			int y = rect.Top + (rect.Height - 7) / 2;
			gfx.FillEllipse(brush, x, y, 7, 7);
		}

		private void DrawCheckMark(Rectangle rect, bool selected)
		{
			SolidBrush brush = CurrentBrush(selected);
			Pen pen = new Pen(brush, 1f);
			int num = rect.Left + rect.Width / 2;
			int num2 = rect.Top + rect.Height / 2;
			Point[] points = new Point[7]
			{
				new Point(num - 4, num2 - 1),
				new Point(num - 4, num2 + 1),
				new Point(num - 2, num2 + 3),
				new Point(num + 2, num2 - 1),
				new Point(num + 2, num2 - 3),
				new Point(num - 2, num2 + 1),
				new Point(num - 4, num2 - 1)
			};
			gfx.FillPolygon(brush, points);
			gfx.DrawLines(pen, points);
		}

		private void DrawImage(Image menuImage, Rectangle bounds)
		{
			if (menuItem.Enabled)
			{
				gfx.DrawImage(menuImage, bounds.Left + 4, bounds.Top + (bounds.Height - iconSize.Height) / 2, iconSize.Width, iconSize.Height);
			}
			else
			{
				ControlPaint.DrawImageDisabled(gfx, menuImage, bounds.Left + 4, bounds.Top + (bounds.Height - iconSize.Height) / 2, SystemColors.Menu);
			}
		}
	}

	private Hashtable hashTable;

	private ImageList imageList;

	private Size iconSize = SystemInformation.SmallIconSize;

	private Font menuFont;

	private bool useSystemFont = true;

	[DefaultValue(null)]
	[Description("The ImageList from which the MenuImage will get all of the MenuItem images.")]
	[Category("Misc")]
	public ImageList ImageList
	{
		get
		{
			return imageList;
		}
		set
		{
			imageList = value;
		}
	}

	[Category("Misc")]
	[Description("The font used to display text in the menu.")]
	public Font Font
	{
		get
		{
			return menuFont;
		}
		set
		{
			menuFont = value;
		}
	}

	[RefreshProperties(RefreshProperties.Repaint)]
	[Category("Misc")]
	[Description("Enable to use a System MenuFont to display text in the menu.")]
	public bool SystemFont
	{
		get
		{
			return useSystemFont;
		}
		set
		{
			useSystemFont = value;
			if (useSystemFont)
			{
				Font = null;
			}
		}
	}

	public MenuExtender(IContainer container)
		: this()
	{
		container.Add(this);
	}

	public MenuExtender()
	{
		hashTable = new Hashtable();
	}

	[TypeConverter(typeof(IndexConverter))]
	[Editor(typeof(ImageIndexEditor), typeof(UITypeEditor))]
	[Category("Menu Extender")]
	[Description("The image index associated with the menu item.")]
	[DefaultValue("(none)")]
	public int GetImageIndex(Component component)
	{
		if (hashTable.Contains(component))
		{
			Properties properties = (Properties)hashTable[component];
			int extImageIndex = properties.ExtImageIndex;
			if (extImageIndex <= -1)
			{
				return -1;
			}
			return extImageIndex;
		}
		return -1;
	}

	public void SetImageIndex(Component component, int indexValue)
	{
		if (indexValue < -1)
		{
			indexValue = -1;
		}
		Properties properties = null;
		if (!hashTable.Contains(component))
		{
			properties = new Properties();
			properties.ExtImageIndex = indexValue;
			hashTable.Add(component, properties);
		}
		else
		{
			properties = (Properties)hashTable[component];
			properties.ExtImageIndex = indexValue;
			hashTable[component] = properties;
		}
	}

	[Description("Enable to use the ExtenderProvider for the menu item.")]
	[Category("Menu Extender")]
	[DefaultValue(false)]
	public bool GetExtEnable(Component component)
	{
		if (hashTable.Contains(component))
		{
			Properties properties = (Properties)hashTable[component];
			return properties.ExtEnable;
		}
		return false;
	}

	public void SetExtEnable(Component component, bool enableExt)
	{
		Properties properties = null;
		if (!hashTable.Contains(component))
		{
			properties = new Properties();
			properties.ExtEnable = enableExt;
			hashTable.Add(component, properties);
		}
		else
		{
			properties = (Properties)hashTable[component];
			properties.ExtEnable = enableExt;
			hashTable[component] = properties;
		}
		MenuItem menuItem = (MenuItem)component;
		menuItem.MeasureItem -= OnMeasureItem;
		menuItem.DrawItem -= OnDrawItem;
		if (properties.ExtEnable)
		{
			menuItem.MeasureItem += OnMeasureItem;
			menuItem.DrawItem += OnDrawItem;
			menuItem.OwnerDraw = true;
		}
	}

	public bool CanExtend(object component)
	{
		if (component is MenuItem)
		{
			MenuItem menuItem = (MenuItem)component;
			return !(menuItem.Parent is MainMenu);
		}
		return false;
	}

	public void ResetFont()
	{
		SystemFont = true;
	}

	private int GetMenuImageIndex(Component component)
	{
		if (imageList == null)
		{
			return -1;
		}
		if (hashTable.Contains(component))
		{
			Properties properties = (Properties)hashTable[component];
			if (properties.ExtEnable && properties.ExtImageIndex < imageList.Images.Count)
			{
				return properties.ExtImageIndex;
			}
		}
		return -1;
	}

	private void OnMeasureItem(object sender, MeasureItemEventArgs e)
	{
		MenuItem item = (MenuItem)sender;
		MenuHelper menuHelper = new MenuHelper(item, e.Graphics, this);
		e.ItemHeight = menuHelper.CalcHeight();
		e.ItemWidth = menuHelper.CalcWidth();
	}

	private void OnDrawItem(object sender, DrawItemEventArgs e)
	{
		MenuItem item = (MenuItem)sender;
		MenuHelper menuHelper = new MenuHelper(item, e.Graphics, this);
		bool selected = (e.State & DrawItemState.Selected) == DrawItemState.Selected;
		menuHelper.DrawBackground(e.Bounds, selected);
		if (menuHelper.IsSeperator())
		{
			menuHelper.DrawSeperator(e.Bounds);
			return;
		}
		int menuImageIndex = GetMenuImageIndex(sender as Component);
		menuHelper.DrawMenu(e.Bounds, selected, menuImageIndex);
	}
}
