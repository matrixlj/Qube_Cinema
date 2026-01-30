using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace Qube.Explorer;

public class ProgressWindow : Form
{
	public delegate void OnProgressHandler(ProgressWindow progressWindow);

	private Container components;

	private Timer _timer = new Timer();

	private ProgressBar _progressBar;

	private Label _statusText;

	private Button _cancel;

	private bool _oneShot;

	private bool _isCancel;

	private int _percentage;

	public string StatusText
	{
		get
		{
			return _statusText.Text;
		}
		set
		{
			_statusText.Text = value;
			Application.DoEvents();
		}
	}

	public int Percentage
	{
		get
		{
			return _percentage;
		}
		set
		{
			_percentage = value;
			_progressBar.Value = _percentage;
			Application.DoEvents();
		}
	}

	public bool OneShot
	{
		get
		{
			return _oneShot;
		}
		set
		{
			_oneShot = value;
		}
	}

	public event OnProgressHandler ProgressHandler;

	public ProgressWindow()
	{
		InitializeComponent();
		_timer.Interval = 200;
		_timer.Tick += _timer_Tick;
		_timer.Enabled = true;
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this._statusText = new System.Windows.Forms.Label();
		this._progressBar = new System.Windows.Forms.ProgressBar();
		this._cancel = new System.Windows.Forms.Button();
		base.SuspendLayout();
		this._statusText.FlatStyle = System.Windows.Forms.FlatStyle.System;
		this._statusText.Location = new System.Drawing.Point(8, 16);
		this._statusText.Name = "_statusText";
		this._statusText.Size = new System.Drawing.Size(280, 40);
		this._statusText.TabIndex = 0;
		this._progressBar.Location = new System.Drawing.Point(8, 64);
		this._progressBar.Name = "_progressBar";
		this._progressBar.Size = new System.Drawing.Size(288, 16);
		this._progressBar.TabIndex = 1;
		this._cancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this._cancel.FlatStyle = System.Windows.Forms.FlatStyle.System;
		this._cancel.Location = new System.Drawing.Point(224, 88);
		this._cancel.Name = "_cancel";
		this._cancel.Size = new System.Drawing.Size(75, 23);
		this._cancel.TabIndex = 2;
		this._cancel.Text = "&Cancel";
		this._cancel.Click += new System.EventHandler(_cancel_Click);
		this.AutoScaleBaseSize = new System.Drawing.Size(5, 13);
		base.CancelButton = this._cancel;
		base.ClientSize = new System.Drawing.Size(306, 122);
		base.ControlBox = false;
		base.Controls.Add(this._cancel);
		base.Controls.Add(this._progressBar);
		base.Controls.Add(this._statusText);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ProgressWindow";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
		base.Closing += new System.ComponentModel.CancelEventHandler(ProgressWindow_Closing);
		base.ResumeLayout(false);
	}

	private void _timer_Tick(object sender, EventArgs e)
	{
		if (_oneShot)
		{
			_timer.Enabled = false;
		}
		if (this.ProgressHandler != null)
		{
			this.ProgressHandler(this);
		}
	}

	private void _cancel_Click(object sender, EventArgs e)
	{
		base.DialogResult = DialogResult.Cancel;
		_isCancel = true;
		_timer.Enabled = false;
		Close();
	}

	private void ProgressWindow_Closing(object sender, CancelEventArgs e)
	{
		if (!_isCancel)
		{
			base.DialogResult = DialogResult.OK;
		}
	}
}
