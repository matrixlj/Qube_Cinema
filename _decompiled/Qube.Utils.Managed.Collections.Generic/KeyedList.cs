using System;
using System.Collections;
using System.Collections.Generic;

namespace Qube.Utils.Managed.Collections.Generic;

[Serializable]
public class KeyedList<K, V> : IDictionary<K, V>, IList<KeyValuePair<K, V>>, ICollection<KeyValuePair<K, V>>, IEnumerable<KeyValuePair<K, V>>, IEnumerable
{
	private Dictionary<K, V> objectTable = new Dictionary<K, V>();

	private List<KeyValuePair<K, V>> objectList = new List<KeyValuePair<K, V>>();

	public bool IsReadOnly => false;

	public int Count => objectList.Count;

	public KeyValuePair<K, V> this[int idx]
	{
		get
		{
			if (idx < 0 || idx >= Count)
			{
				throw new ArgumentOutOfRangeException("index");
			}
			return objectList[idx];
		}
		set
		{
			if (idx < 0 || idx >= Count)
			{
				throw new ArgumentOutOfRangeException("index");
			}
			objectList[idx] = value;
			objectTable[value.Key] = value.Value;
		}
	}

	public virtual V this[K key]
	{
		get
		{
			return objectTable[key];
		}
		set
		{
			if (objectTable.ContainsKey(key))
			{
				objectTable[key] = value;
				objectList[IndexOf(key)] = new KeyValuePair<K, V>(key, value);
			}
			else
			{
				Add(key, value);
			}
		}
	}

	public ICollection<K> Keys => objectTable.Keys;

	public ICollection<V> Values => objectTable.Values;

	public List<K> OrderedKeys
	{
		get
		{
			List<K> list = new List<K>();
			foreach (KeyValuePair<K, V> @object in objectList)
			{
				list.Add(@object.Key);
			}
			return list;
		}
	}

	public List<V> OrderedValues
	{
		get
		{
			List<V> list = new List<V>();
			foreach (KeyValuePair<K, V> @object in objectList)
			{
				list.Add(@object.Value);
			}
			return list;
		}
	}

	public Dictionary<K, V> ObjectTable => objectTable;

	public K GetKey(int idx)
	{
		if (idx < 0 || idx >= Count)
		{
			throw new ArgumentOutOfRangeException("index");
		}
		return objectList[idx].Key;
	}

	public V GetValue(int idx)
	{
		if (idx < 0 || idx >= Count)
		{
			throw new ArgumentOutOfRangeException("index");
		}
		return objectList[idx].Value;
	}

	public int IndexOf(K key)
	{
		int result = -1;
		for (int i = 0; i < objectList.Count; i++)
		{
			if (objectList[i].Key.Equals(key))
			{
				result = i;
				break;
			}
		}
		return result;
	}

	public int IndexOf(KeyValuePair<K, V> kvp)
	{
		return IndexOf(kvp.Key);
	}

	public void Clear()
	{
		objectTable.Clear();
		objectList.Clear();
	}

	public bool ContainsKey(K key)
	{
		return objectTable.ContainsKey(key);
	}

	public bool Contains(KeyValuePair<K, V> kvp)
	{
		return objectTable.ContainsKey(kvp.Key);
	}

	public void Add(K key, V value)
	{
		objectTable.Add(key, value);
		objectList.Add(new KeyValuePair<K, V>(key, value));
	}

	public void Add(KeyValuePair<K, V> kvp)
	{
		Add(kvp.Key, kvp.Value);
	}

	public void CopyTo(KeyValuePair<K, V>[] kvpa, int idx)
	{
		objectList.CopyTo(kvpa, idx);
	}

	public void Insert(int idx, K key, V value)
	{
		if (idx < 0 || idx > Count)
		{
			throw new ArgumentOutOfRangeException("index");
		}
		objectTable.Add(key, value);
		objectList.Insert(idx, new KeyValuePair<K, V>(key, value));
	}

	public void Insert(int idx, KeyValuePair<K, V> kvp)
	{
		if (idx < 0 || idx > Count)
		{
			throw new ArgumentOutOfRangeException("index");
		}
		objectTable.Add(kvp.Key, kvp.Value);
		objectList.Insert(idx, kvp);
	}

	public bool Remove(K key)
	{
		bool flag = objectTable.Remove(key);
		if (flag)
		{
			objectList.RemoveAt(IndexOf(key));
		}
		return flag;
	}

	public bool Remove(KeyValuePair<K, V> kvp)
	{
		return Remove(kvp.Key);
	}

	public void RemoveAt(int idx)
	{
		if (idx < 0 || idx >= Count)
		{
			throw new ArgumentOutOfRangeException("index");
		}
		objectTable.Remove(objectList[idx].Key);
		objectList.RemoveAt(idx);
	}

	public bool TryGetValue(K key, out V val)
	{
		return objectTable.TryGetValue(key, out val);
	}

	IEnumerator IEnumerable.GetEnumerator()
	{
		return objectList.GetEnumerator();
	}

	IEnumerator<KeyValuePair<K, V>> IEnumerable<KeyValuePair<K, V>>.GetEnumerator()
	{
		return objectList.GetEnumerator();
	}
}
