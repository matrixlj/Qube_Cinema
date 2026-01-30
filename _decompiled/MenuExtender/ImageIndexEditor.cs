using System;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Drawing.Design;
using System.Windows.Forms;
using System.Windows.Forms.Design;

namespace MenuExtender;

internal class ImageIndexEditor : UITypeEditor
{
	internal class ImageSelector : ListView
	{
		private ImageList imageList;

		private IWindowsFormsEditorService wfes;

		public ImageSelector(ImageList images, int selectedIndex, IWindowsFormsEditorService wfes)
		{
			this.wfes = wfes;
			base.BorderStyle = BorderStyle.None;
			base.View = View.Details;
			base.FullRowSelect = true;
			base.GridLines = false;
			base.Columns.Add("Index", -2, HorizontalAlignment.Left);
			base.HeaderStyle = ColumnHeaderStyle.None;
			base.MultiSelect = false;
			base.Click += ImageSelector_Click;
			if (images != null)
			{
				if (images.ImageSize == SystemInformation.SmallIconSize)
				{
					imageList = images;
				}
				else
				{
					imageList = new ImageList();
					imageList.ImageSize = SystemInformation.SmallIconSize;
					for (int i = 0; i < images.Images.Count; i++)
					{
						imageList.Images.Add(images.Images[i]);
					}
				}
				base.SmallImageList = imageList;
				for (int j = 0; j < imageList.Images.Count; j++)
				{
					base.Items.Add(j.ToString(), j);
				}
			}
			base.Items.Add("(none)");
			if (selectedIndex < 0 || selectedIndex >= base.Items.Count)
			{
				selectedIndex = base.Items.Count - 1;
			}
			base.Items[selectedIndex].Selected = true;
			base.Items[selectedIndex].EnsureVisible();
		}

		protected void ImageSelector_Click(object sender, EventArgs e)
		{
			if (wfes != null)
			{
				wfes.CloseDropDown();
			}
		}
	}

	public override UITypeEditorEditStyle GetEditStyle(ITypeDescriptorContext context)
	{
		if (context != null && context.Instance != null)
		{
			return UITypeEditorEditStyle.DropDown;
		}
		return base.GetEditStyle(context);
	}

	public override bool GetPaintValueSupported(ITypeDescriptorContext context)
	{
		return true;
	}

	public override void PaintValue(PaintValueEventArgs pe)
	{
		int num = -1;
		if (pe.Value != null)
		{
			try
			{
				num = Convert.ToUInt16(pe.Value.ToString());
			}
			catch
			{
				num = -1;
			}
		}
		if (pe.Context.Instance == null || num < 0)
		{
			return;
		}
		ImageList imageList = null;
		Component component = (Component)pe.Context.Instance;
		IExtenderListService extenderListService = (IExtenderListService)component.Site.GetService(typeof(IExtenderListService));
		if (extenderListService != null)
		{
			IExtenderProvider[] extenderProviders = extenderListService.GetExtenderProviders();
			for (int i = 0; i < extenderProviders.Length; i++)
			{
				if (extenderProviders[i].GetType().FullName == "MenuExtender.MenuExtender")
				{
					MenuExtender menuExtender = (MenuExtender)extenderProviders[i];
					imageList = menuExtender.ImageList;
				}
			}
		}
		if (imageList != null && !imageList.Images.Empty && num < imageList.Images.Count)
		{
			pe.Graphics.DrawImage(imageList.Images[num], pe.Bounds);
		}
	}

	public override object EditValue(ITypeDescriptorContext context, IServiceProvider provider, object value)
	{
		IWindowsFormsEditorService windowsFormsEditorService = (IWindowsFormsEditorService)provider.GetService(typeof(IWindowsFormsEditorService));
		if (windowsFormsEditorService == null || context == null)
		{
			return null;
		}
		ImageList images = null;
		Component component = (Component)context.Instance;
		IExtenderListService extenderListService = (IExtenderListService)component.Site.GetService(typeof(IExtenderListService));
		if (extenderListService != null)
		{
			IExtenderProvider[] extenderProviders = extenderListService.GetExtenderProviders();
			for (int i = 0; i < extenderProviders.Length; i++)
			{
				if (extenderProviders[i].GetType().FullName == "MenuExtender.MenuExtender")
				{
					MenuExtender menuExtender = (MenuExtender)extenderProviders[i];
					images = menuExtender.ImageList;
				}
			}
		}
		ImageSelector imageSelector = new ImageSelector(images, (int)value, windowsFormsEditorService);
		windowsFormsEditorService.DropDownControl(imageSelector);
		int num = -1;
		if (imageSelector.SelectedItems.Count != 0)
		{
			try
			{
				num = Convert.ToInt32(imageSelector.SelectedItems[0].Text);
			}
			catch
			{
				num = -1;
			}
		}
		return num;
	}
}
