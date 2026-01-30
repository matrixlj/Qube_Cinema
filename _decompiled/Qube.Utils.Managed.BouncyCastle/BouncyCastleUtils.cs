using System;
using System.Collections;
using Org.BouncyCastle.Asn1;
using Org.BouncyCastle.Asn1.X509;

namespace Qube.Utils.Managed.BouncyCastle;

public static class BouncyCastleUtils
{
	static BouncyCastleUtils()
	{
		X509Name.DefaultLookup["dnqualifier"] = X509Name.DnQualifier;
	}

	public static string GetDnQualifier(string subjectName)
	{
		return GetX509NameAttributeValue(subjectName, "dnqualifier");
	}

	public static bool IsX509NameEquals(string dirName1, string dirName2)
	{
		X509Name x509Name = new X509Name(dirName1);
		X509Name other = new X509Name(dirName2);
		return x509Name.Equivalent(other, inOrder: false);
	}

	public static string GetX509NameAttributeValue(string dirName, string attribute)
	{
		X509Name x509Name = new X509Name(dirName);
		string key = attribute.ToLowerInvariant();
		IList valueList = x509Name.GetValueList(X509Name.DefaultLookup[key] as DerObjectIdentifier);
		if (valueList.Count == 0)
		{
			throw new ApplicationException($"{attribute} not found.");
		}
		foreach (object item in valueList)
		{
			if (item is string)
			{
				return item.ToString();
			}
		}
		throw new ApplicationException($"Unexpected {attribute} value type found.");
	}
}
