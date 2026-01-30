using System.Collections.Generic;

namespace Qube.Utils.Managed.Collections;

public static class Extensions
{
	public static ReadOnlyDictionary<TKey, TValue> AsReadOnly<TKey, TValue>(this IDictionary<TKey, TValue> dictionary)
	{
		return new ReadOnlyDictionary<TKey, TValue>(dictionary);
	}
}
