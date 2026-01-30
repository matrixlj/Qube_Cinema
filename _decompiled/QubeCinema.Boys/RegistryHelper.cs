using Microsoft.Win32;

namespace QubeCinema.Boys;

public class RegistryHelper
{
	public static string GetValue(string localMachineRegKeyPath, string keyName)
	{
		using RegistryKey registryKey = Registry.LocalMachine.OpenSubKey(localMachineRegKeyPath);
		object value;
		if (registryKey == null || (value = registryKey.GetValue(keyName)) == null)
		{
			return null;
		}
		return value.ToString();
	}

	public static RegistryKey CreateLocalMachineSubKey(string key)
	{
		return Registry.LocalMachine.CreateSubKey(key);
	}
}
