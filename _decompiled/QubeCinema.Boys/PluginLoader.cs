using System;
using System.IO;
using System.Reflection;

namespace QubeCinema.Boys;

public class PluginLoader
{
	public delegate void OnTypeFoundHandler(Type type);

	private Type[] _superClasses;

	public event OnTypeFoundHandler OnTypeFound;

	private void _Traverse(string path, string wildCard)
	{
		DirectoryInfo directoryInfo = new DirectoryInfo(path);
		FileInfo[] files = directoryInfo.GetFiles(wildCard);
		FileInfo[] array = files;
		foreach (FileInfo fileInfo in array)
		{
			try
			{
				Assembly assembly = Assembly.LoadFrom(fileInfo.FullName);
				Type[] types = assembly.GetTypes();
				foreach (Type type in types)
				{
					Type[] superClasses = _superClasses;
					foreach (Type type2 in superClasses)
					{
						if (!type.Equals(type2) && type2.IsAssignableFrom(type))
						{
							this.OnTypeFound(type);
						}
					}
				}
			}
			catch (Exception)
			{
			}
		}
	}

	public void Load(string path, string wildCard, Type superClass)
	{
		_superClasses = new Type[1] { superClass };
		_Traverse(path, wildCard);
	}

	public void Load(string path, string wildCard, Type[] superClasses)
	{
		_superClasses = superClasses;
		_Traverse(path, wildCard);
	}
}
