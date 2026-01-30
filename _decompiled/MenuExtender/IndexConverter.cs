using System;
using System.ComponentModel;
using System.Globalization;

namespace MenuExtender;

internal class IndexConverter : TypeConverter
{
	public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType)
	{
		if ((object)sourceType == typeof(string))
		{
			return true;
		}
		return base.CanConvertFrom(context, sourceType);
	}

	public override bool CanConvertTo(ITypeDescriptorContext context, Type destinationType)
	{
		if ((object)destinationType == typeof(string))
		{
			return true;
		}
		return base.CanConvertTo(context, destinationType);
	}

	public override object ConvertFrom(ITypeDescriptorContext context, CultureInfo culture, object value)
	{
		if (value is string)
		{
			int num = 0;
			string text = (string)value;
			if (value != null && text.Length > 0 && text != "(none)")
			{
				try
				{
					num = Convert.ToUInt16(text);
				}
				catch
				{
					return -1;
				}
				return num;
			}
			return -1;
		}
		return base.ConvertFrom(context, culture, value);
	}

	public override object ConvertTo(ITypeDescriptorContext context, CultureInfo culture, object value, Type destinationType)
	{
		if ((object)destinationType == typeof(string) && value is int)
		{
			if ((int)value <= -1)
			{
				return "(none)";
			}
			return value.ToString();
		}
		return base.ConvertTo(context, culture, value, destinationType);
	}
}
