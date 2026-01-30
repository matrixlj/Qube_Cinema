using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using System.Xml;

namespace Qube.Utils.Managed.Serializer;

public class DataContractSerializer
{
	public static string Serialize<T>(T obj, IEnumerable<Type> knownTypes)
	{
		System.Runtime.Serialization.DataContractSerializer dataContractSerializer = new System.Runtime.Serialization.DataContractSerializer(typeof(T), knownTypes);
		using MemoryStream memoryStream = new MemoryStream();
		dataContractSerializer.WriteObject(memoryStream, obj);
		memoryStream.Position = 0L;
		using StreamReader streamReader = new StreamReader(memoryStream);
		return streamReader.ReadToEnd();
	}

	public static T Deserialize<T>(string xml, IEnumerable<Type> knownTypes)
	{
		using StringReader input = new StringReader(xml);
		using XmlReader reader = XmlReader.Create(input);
		System.Runtime.Serialization.DataContractSerializer dataContractSerializer = new System.Runtime.Serialization.DataContractSerializer(typeof(T), knownTypes);
		object value = dataContractSerializer.ReadObject(reader);
		return (T)Convert.ChangeType(value, typeof(T));
	}
}
