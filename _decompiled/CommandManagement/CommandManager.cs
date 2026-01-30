using System;
using System.Collections;
using System.ComponentModel;
using System.Windows.Forms;

namespace CommandManagement;

public class CommandManager : Component
{
	public class CommandsList : ICollection, IEnumerable
	{
		private SortedList commands;

		private CommandManager cmdmgr;

		internal CommandManager Manager
		{
			get
			{
				return cmdmgr;
			}
			set
			{
				cmdmgr = value;
			}
		}

		public object SyncRoot => commands.SyncRoot;

		public bool IsSynchronized => commands.IsSynchronized;

		public int Count => commands.Count;

		public Command this[string cmdTag] => commands[cmdTag] as Command;

		internal CommandsList(CommandManager amgr)
		{
			cmdmgr = amgr;
			commands = new SortedList();
		}

		public void CopyTo(Array array, int index)
		{
			commands.CopyTo(array, index);
		}

		public IEnumerator GetEnumerator()
		{
			return commands.GetEnumerator();
		}

		public void Add(Command command)
		{
			command.Manager = Manager;
			commands.Add(command.ToString(), command);
		}

		public void Remove(string cmdTag)
		{
			commands.Remove(cmdTag);
		}

		public bool Contains(string cmdTag)
		{
			return commands.Contains(cmdTag);
		}
	}

	private CommandsList commands;

	private Hashtable hashCommandExecutors;

	public CommandsList Commands => commands;

	public CommandManager()
	{
		commands = new CommandsList(this);
		hashCommandExecutors = new Hashtable();
		Application.Idle += OnIdle;
		RegisterCommandExecutor("System.Windows.Forms.MenuItem", new MenuCommandExecutor());
		RegisterCommandExecutor("System.Windows.Forms.ToolBarButton", new ToolbarCommandExecutor());
	}

	internal void RegisterCommandExecutor(string strType, CommandExecutor executor)
	{
		hashCommandExecutors.Add(strType, executor);
	}

	internal CommandExecutor GetCommandExecutor(object instance)
	{
		return hashCommandExecutors[instance.GetType().ToString()] as CommandExecutor;
	}

	private void OnIdle(object sender, EventArgs args)
	{
		IDictionaryEnumerator dictionaryEnumerator = (IDictionaryEnumerator)commands.GetEnumerator();
		while (dictionaryEnumerator.MoveNext())
		{
			if (dictionaryEnumerator.Value is Command command)
			{
				command.ProcessUpdates();
			}
		}
	}
}
