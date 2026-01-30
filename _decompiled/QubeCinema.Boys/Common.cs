using System;
using System.Diagnostics;
using System.IO;
using System.Security.Principal;
using System.Text;
using System.Xml.XPath;
using Qube.ExtensionMethods;
using Qube.Utils.Managed.BouncyCastle;

namespace QubeCinema.Boys;

public static class Common
{
	public class Path
	{
		public static string SuffixSlashIfNotExists(string path)
		{
			if (!path.EndsWith("\\") && !path.EndsWith("/"))
			{
				path += "/";
			}
			return new Uri(path).GetPath();
		}
	}

	public static readonly UpperCaseUtf8Encoding UPPER_CASE_UTF8_ENCODING = new UpperCaseUtf8Encoding();

	public static UserGroup GetUserGroup()
	{
		IdentityReferenceCollection groups = WindowsIdentity.GetCurrent().Groups;
		UserGroup userGroup = UserGroup.None;
		_ = Environment.MachineName;
		foreach (IdentityReference item in groups)
		{
			string value = ((NTAccount)item.Translate(typeof(NTAccount))).Value;
			string[] array = value.Split('\\');
			if (array.Length > 0)
			{
				if (string.Compare(array[array.Length - 1], "Projectionists", ignoreCase: false) == 0)
				{
					userGroup = UserGroup.Projectionists;
				}
				if (string.Compare(array[array.Length - 1], "Managers", ignoreCase: false) == 0)
				{
					userGroup = UserGroup.Managers;
				}
				if (string.Compare(array[array.Length - 1], "Power Users", ignoreCase: false) == 0)
				{
					userGroup = UserGroup.Powerusers;
				}
				if (value.ToLower().Contains("administrators"))
				{
					userGroup = UserGroup.Administrators;
				}
				if (userGroup != UserGroup.None)
				{
					break;
				}
			}
		}
		return userGroup;
	}

	public static string GetQubeXPCommonAppDataPath()
	{
		string folderPath = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
		string text = System.IO.Path.Combine(folderPath, "Qube Cinema\\XP");
		if (!Directory.Exists(text))
		{
			Directory.CreateDirectory(text);
		}
		return text;
	}

	public static string GetSerialNumber(string subjectName)
	{
		string x509NameAttributeValue = BouncyCastleUtils.GetX509NameAttributeValue(subjectName, "cn");
		return x509NameAttributeValue.Split('.')[1];
	}

	public static string GetNumericSerialNumber(string serverSerialNumber)
	{
		return serverSerialNumber.Split('-')[1];
	}

	public static bool IsAQ10ServerSerialNumber(string serverSerialNumber)
	{
		return serverSerialNumber.StartsWith("AQ10");
	}

	public static string GetKdmRecipientDnQualifier(string kdmXml)
	{
		string kdmRecipientSubjectName = GetKdmRecipientSubjectName(kdmXml);
		return BouncyCastleUtils.GetDnQualifier(kdmRecipientSubjectName);
	}

	public static string GetKdmRecipientSubjectName(string kdmXml)
	{
		using StringReader textReader = new StringReader(kdmXml);
		XPathDocument xPathDocument = new XPathDocument(textReader);
		XPathNavigator xPathNavigator = xPathDocument.CreateNavigator();
		XPathExpression expr = xPathNavigator.Compile("//*[contains(name(), 'Recipient')]/*[contains(name(), 'X509SubjectName')]");
		XPathNodeIterator xPathNodeIterator = xPathNavigator.Select(expr);
		if (!xPathNodeIterator.MoveNext())
		{
			throw new Exception("Recipient subject name not found.");
		}
		return xPathNodeIterator.Current.Value;
	}

	public static string GetCallStack()
	{
		StackTrace stackTrace = new StackTrace();
		StackFrame[] frames = stackTrace.GetFrames();
		if (frames == null)
		{
			return string.Empty;
		}
		StringBuilder stringBuilder = new StringBuilder();
		for (int i = 1; i < frames.Length; i++)
		{
			stringBuilder.AppendLine(frames[i].GetMethod().Name);
		}
		return stringBuilder.ToString();
	}
}
