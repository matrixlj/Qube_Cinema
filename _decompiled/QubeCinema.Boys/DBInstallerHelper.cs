using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Xml;
using Microsoft.SqlServer.Management.Smo;

namespace QubeCinema.Boys;

public class DBInstallerHelper
{
	public static void SaveSchemaVersion(Server server, string module, int version)
	{
		string text = (((int)server.ConnectionContext.ExecuteScalar($"SELECT COUNT(*) FROM SchemaVersions WHERE module='{module}'") <= 0) ? $"INSERT INTO SchemaVersions(module, version) VALUES ('{module}', '{version}')" : $"UPDATE SchemaVersions SET version='{version}', [when]=GETDATE() WHERE module='{module}'");
		server.ConnectionContext.ExecuteNonQuery(text);
	}

	public static string GetResourceContent(Assembly assembly, string fileName)
	{
		using Stream stream = assembly.GetManifestResourceStream(fileName);
		if (stream == null)
		{
			throw new Exception(fileName + " not found.");
		}
		using StreamReader streamReader = new StreamReader(stream);
		return streamReader.ReadToEnd();
	}

	public static List<string> GetNewOrModifiedSql(XmlDocument dbXml, int currentVersion, string expression)
	{
		XmlNodeList source = dbXml.SelectNodes(expression);
		IEnumerable<string> source2 = from XmlNode node in source
			where Convert.ToInt32(node.Attributes["version"].Value) > currentVersion
			select node.Attributes["sql"].Value;
		return source2.ToList();
	}
}
