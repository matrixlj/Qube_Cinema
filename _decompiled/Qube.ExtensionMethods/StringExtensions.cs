using System;
using System.Text.RegularExpressions;
using System.Web;

namespace Qube.ExtensionMethods;

public static class StringExtensions
{
	public static string ReplaceEx(this string str, string original, string pattern, string replacement)
	{
		int num;
		int num2;
		int length = (num = (num2 = 0));
		string text = original.ToUpper();
		string value = pattern.ToUpper();
		int val = original.Length / pattern.Length * (replacement.Length - pattern.Length);
		char[] array = new char[original.Length + Math.Max(0, val)];
		while ((num2 = text.IndexOf(value, num)) != -1)
		{
			for (int i = num; i < num2; i++)
			{
				array[length++] = original[i];
			}
			for (int j = 0; j < replacement.Length; j++)
			{
				array[length++] = replacement[j];
			}
			num = num2 + pattern.Length;
		}
		if (num == 0)
		{
			return original;
		}
		for (int k = num; k < original.Length; k++)
		{
			array[length++] = original[k];
		}
		return new string(array, 0, length);
	}

	public static bool IsNullOrWhiteSpace(this string str)
	{
		if (str != null)
		{
			return str.Trim().Length == 0;
		}
		return true;
	}

	public static string ToWindowsPathStyle(this string path)
	{
		if (path.IsNullOrWhiteSpace())
		{
			return path;
		}
		return new Uri(path).GetPath();
	}

	public static string NormalizeUnsupportedChar(this string str)
	{
		return str.NormalizeUnsupportedChar("[^\\s\\w\\(\\).-]");
	}

	public static string NormalizeUnsupportedChar(this string str, string pattern)
	{
		if (str.IsNullOrWhiteSpace())
		{
			return str;
		}
		Regex regex = new Regex(pattern);
		return regex.Replace(str, "_");
	}

	public static string Trim2Length(this string str, int length)
	{
		if (str.Length > length)
		{
			return str.Substring(0, length - 1);
		}
		return str;
	}

	public static string UrlDecode(this string str)
	{
		return Uri.UnescapeDataString(str);
	}

	public static string UrlEncode(this string str)
	{
		return HttpUtility.UrlPathEncode(str);
	}
}
