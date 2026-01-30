using System;
using System.Text.RegularExpressions;

namespace Qube.Utils.Managed;

public static class StringUtils
{
	public static string NormalizeNewLines(string text)
	{
		Regex regex = new Regex("(\\r\\n)|(?!\\r)(\\n)");
		return regex.Replace(text, Environment.NewLine);
	}

	public static string RemoveEmptyLines(string text)
	{
		Regex regex = new Regex(string.Format("(({0}(\\t|\\s)*({0})*))", Environment.NewLine));
		return regex.Replace(text, Environment.NewLine);
	}
}
