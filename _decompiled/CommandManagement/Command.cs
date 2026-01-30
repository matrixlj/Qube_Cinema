using System;
using System.Collections;

namespace CommandManagement;

public class Command
{
	public delegate void UpdateHandler(Command cmd);

	public delegate void ExecuteHandler(Command cmd);

	public class CommandInstanceList : CollectionBase
	{
		private Command command;

		public object this[int index] => base.List[index];

		internal CommandInstanceList(Command acmd)
		{
			command = acmd;
		}

		public void Add(object instance)
		{
			base.List.Add(instance);
		}

		public void Add(object[] items)
		{
			foreach (object instance in items)
			{
				Add(instance);
			}
		}

		public void Remove(object instance)
		{
			base.List.Remove(instance);
		}

		protected override void OnInsertComplete(int index, object value)
		{
			command.Manager.GetCommandExecutor(value).InstanceAdded(value, command);
		}
	}

	private CommandInstanceList commandInstances;

	private CommandManager manager;

	private string strTag;

	protected bool enabled;

	protected bool check;

	public CommandInstanceList CommandInstances => commandInstances;

	public string Tag => strTag;

	internal CommandManager Manager
	{
		get
		{
			return manager;
		}
		set
		{
			manager = value;
		}
	}

	public bool Enabled
	{
		get
		{
			return enabled;
		}
		set
		{
			enabled = value;
			foreach (object commandInstance in commandInstances)
			{
				Manager.GetCommandExecutor(commandInstance).Enable(commandInstance, enabled);
			}
		}
	}

	public bool Checked
	{
		get
		{
			return check;
		}
		set
		{
			check = value;
			foreach (object commandInstance in commandInstances)
			{
				Manager.GetCommandExecutor(commandInstance).Check(commandInstance, check);
			}
		}
	}

	public event UpdateHandler OnUpdate;

	public event ExecuteHandler OnExecute;

	public Command(string strTag, ExecuteHandler handlerExecute, UpdateHandler handlerUpdate)
	{
		commandInstances = new CommandInstanceList(this);
		this.strTag = strTag;
		this.OnUpdate = (UpdateHandler)Delegate.Combine(this.OnUpdate, handlerUpdate);
		this.OnExecute = (ExecuteHandler)Delegate.Combine(this.OnExecute, handlerExecute);
	}

	public override string ToString()
	{
		return Tag;
	}

	public void Execute()
	{
		if (this.OnExecute != null)
		{
			this.OnExecute(this);
		}
	}

	internal void ProcessUpdates()
	{
		if (this.OnUpdate != null)
		{
			this.OnUpdate(this);
		}
	}
}
