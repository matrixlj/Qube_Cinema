using System;

namespace Qube.Utils.Managed.Registry;

[Flags]
public enum RegChangeNotifyFilter
{
	Key = 1,
	Attribute = 2,
	Value = 4,
	Security = 8
}
