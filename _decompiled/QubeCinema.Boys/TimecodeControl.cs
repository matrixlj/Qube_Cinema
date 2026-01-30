using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace QubeCinema.Boys;

public class TimecodeControl : UserControl
{
	private IButtonControl _acceptButton;

	private TextBox _timecode;

	private NumericUpDown NUDScroll;

	private bool _carry = true;

	private decimal _fps = 1000m;

	private string _prevTCValue;

	private string _oldTCValue;

	private Container components;

	private char _delimiter = ':';

	private int _HMSlen = 2;

	private int _frameslen = 3;

	private int _maxLength;

	private int _curpos;

	private bool _needsFormatting = true;

	private bool _charDeleted;

	private decimal _scrollOldValue;

	private bool _freeForm;

	public bool Carry
	{
		get
		{
			return _carry;
		}
		set
		{
			_carry = value;
		}
	}

	public decimal FPS
	{
		get
		{
			return _fps;
		}
		set
		{
			_fps = value;
			_frameslen = ((_fps >= 1000m) ? 3 : 2);
			_maxLength = _frameslen + 3 * _HMSlen;
			Seconds = Seconds;
		}
	}

	public decimal Seconds
	{
		get
		{
			Timecode timecode = new Timecode(_fps, 0);
			timecode.SetHMSF(_timecode.Text);
			return timecode.Seconds;
		}
		set
		{
			Timecode timecode = new Timecode(_fps, 0);
			timecode.Seconds = value;
			_timecode.Text = (_prevTCValue = timecode.GetHMSF());
		}
	}

	public string HMSF => _timecode.Text;

	public override Font Font
	{
		get
		{
			return _timecode.Font;
		}
		set
		{
			_timecode.Font = value;
			base.Font = value;
		}
	}

	public override Color BackColor
	{
		set
		{
			if (value != Color.Transparent)
			{
				_timecode.BackColor = value;
			}
		}
	}

	public override Color ForeColor
	{
		set
		{
			if (value != Color.Transparent)
			{
				_timecode.ForeColor = value;
			}
		}
	}

	public event ValueChangedEventHandler ValueChanged;

	public TimecodeControl()
	{
		InitializeComponent();
		_timecode.Text = (_prevTCValue = "00:00:00:000");
		_maxLength = _frameslen + 3 * _HMSlen;
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
		this._timecode = new System.Windows.Forms.TextBox();
		this.NUDScroll = new System.Windows.Forms.NumericUpDown();
		((System.ComponentModel.ISupportInitialize)this.NUDScroll).BeginInit();
		base.SuspendLayout();
		this._timecode.AcceptsReturn = true;
		this._timecode.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom;
		this._timecode.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this._timecode.Font = new System.Drawing.Font("MS Reference Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this._timecode.Location = new System.Drawing.Point(0, 0);
		this._timecode.Margin = new System.Windows.Forms.Padding(3, 6, 3, 3);
		this._timecode.Multiline = true;
		this._timecode.Name = "_timecode";
		this._timecode.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
		this._timecode.Size = new System.Drawing.Size(101, 20);
		this._timecode.TabIndex = 0;
		this._timecode.Click += new System.EventHandler(_timecode_Click);
		this._timecode.MouseClick += new System.Windows.Forms.MouseEventHandler(_timecode_MouseClick);
		this._timecode.MouseDoubleClick += new System.Windows.Forms.MouseEventHandler(_timecode_MouseDoubleClick);
		this._timecode.KeyUp += new System.Windows.Forms.KeyEventHandler(_timecode_KeyUp);
		this._timecode.KeyPress += new System.Windows.Forms.KeyPressEventHandler(_timecode_KeyPress);
		this._timecode.KeyDown += new System.Windows.Forms.KeyEventHandler(_timecode_KeyDown);
		this.NUDScroll.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.NUDScroll.Location = new System.Drawing.Point(101, 0);
		this.NUDScroll.Maximum = new decimal(new int[4] { 1410065408, 2, 0, 0 });
		this.NUDScroll.Minimum = new decimal(new int[4] { 1410065408, 2, 0, -2147483648 });
		this.NUDScroll.Name = "NUDScroll";
		this.NUDScroll.Size = new System.Drawing.Size(18, 23);
		this.NUDScroll.TabIndex = 3;
		this.NUDScroll.TabStop = false;
		this.NUDScroll.ValueChanged += new System.EventHandler(NUDScroll_ValueChanged);
		this.NUDScroll.KeyDown += new System.Windows.Forms.KeyEventHandler(NUDScroll_KeyDown);
		base.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		base.Controls.Add(this.NUDScroll);
		base.Controls.Add(this._timecode);
		this.Font = new System.Drawing.Font("MS Reference Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		base.Name = "TimecodeControl";
		base.Size = new System.Drawing.Size(119, 23);
		base.Enter += new System.EventHandler(TimecodeControl_Enter);
		base.Load += new System.EventHandler(TimecodeControl_Load);
		base.Leave += new System.EventHandler(TimecodeControl_Leave);
		((System.ComponentModel.ISupportInitialize)this.NUDScroll).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private string _GetFormattedTC(string tcEntry)
	{
		if (_freeForm)
		{
			int hh = 0;
			int mm = 0;
			int ss = 0;
			int fr = 0;
			int num = 0;
			string[] array = tcEntry.Split('.');
			for (int num2 = array.Length - 1; num2 >= 0; num2--)
			{
				if (array[num2].ToString() != "")
				{
					switch (num)
					{
					case 0:
						fr = Convert.ToInt32(array[num2].ToString());
						break;
					case 1:
						ss = Convert.ToInt32(array[num2].ToString());
						break;
					case 2:
						mm = Convert.ToInt32(array[num2].ToString());
						break;
					case 3:
						hh = Convert.ToInt32(array[num2].ToString());
						break;
					}
					if (num == 3)
					{
						break;
					}
					num++;
				}
			}
			return _Reformat(hh, mm, ss, fr);
		}
		Timecode timecode = new Timecode(_fps, 0);
		timecode.SetHMSF(_timecode.Text);
		return timecode.GetHMSF();
	}

	private string _Reformat(int hh, int mm, int ss, int fr)
	{
		Timecode timecode = new Timecode(FPS, 0);
		timecode.SetHMSF(hh, mm, ss, fr);
		return timecode.GetHMSF();
	}

	private void _timecode_Click(object sender, EventArgs e)
	{
		_ = _timecode.TextLength;
	}

	private void TimecodeControl_Leave(object sender, EventArgs e)
	{
		_Validate();
		_timecode.SelectionStart = 0;
		_timecode.SelectionLength = _timecode.TextLength;
		base.ParentForm.AcceptButton = _acceptButton;
	}

	private void _Undo()
	{
		_timecode.Text = _prevTCValue;
		_timecode.Select(0, 0);
	}

	private void _Validate()
	{
		try
		{
			_ReplaceDelimiter(Convert.ToChar(":"));
			string text = _timecode.Text;
			string text2;
			if (text != "")
			{
				text2 = _GetFormattedTC(text);
				if (!_IsValidHour(text2))
				{
					_Undo();
					return;
				}
			}
			else
			{
				Seconds = 0m;
				text2 = HMSF;
			}
			_timecode.Text = (_prevTCValue = text2);
			NUDScroll.ValueChanged -= NUDScroll_ValueChanged;
			NUDScroll.Value = 0m;
			NUDScroll.ValueChanged += NUDScroll_ValueChanged;
			_scrollOldValue = 0m;
		}
		catch
		{
			_Undo();
		}
		finally
		{
			if (this.ValueChanged != null && _timecode.Text != _oldTCValue)
			{
				this.ValueChanged();
			}
			if (_freeForm)
			{
				_freeForm = false;
			}
		}
	}

	private void _timecode_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (!_IsValidChar(e.KeyChar))
		{
			e.Handled = true;
			return;
		}
		switch (e.KeyChar)
		{
		case ':':
		case ';':
			_ReplaceDelimiter(e.KeyChar);
			e.Handled = true;
			return;
		case '.':
			if (!_freeForm)
			{
				_AppendZeroes();
				e.Handled = true;
			}
			else if (_timecode.TextLength != _timecode.SelectionStart && _timecode.Text[_timecode.SelectionStart].ToString() == ".")
			{
				e.Handled = true;
			}
			else if (_timecode.TextLength == 0 || _timecode.SelectionStart == 0)
			{
				e.Handled = true;
			}
			else if (_timecode.SelectionStart >= 1 && _timecode.Text[_timecode.SelectionStart - 1].ToString() == ".")
			{
				e.Handled = true;
			}
			else if (_timecode.TextLength == _maxLength + 3)
			{
				if (_timecode.SelectionStart + 1 < _timecode.TextLength && _timecode.Text[_timecode.SelectionStart + 1].ToString() == ".")
				{
					e.Handled = true;
				}
				else if (_timecode.SelectionLength == 0)
				{
					e.Handled = true;
				}
			}
			return;
		case '\b':
			if (!_needsFormatting && !_freeForm)
			{
				e.Handled = true;
			}
			return;
		}
		if (_freeForm)
		{
			if (_timecode.TextLength == _maxLength + 3 && _timecode.SelectionLength == 0)
			{
				e.Handled = true;
			}
		}
		else if (_IsMaxLength() && (_timecode.SelectionLength == 0 || _timecode.SelectedText == ":" || _timecode.SelectedText == ";"))
		{
			e.Handled = true;
		}
	}

	private bool _IsMaxLength()
	{
		return _GetOnlyNumbers().Length >= _maxLength;
	}

	private void _FormatTCEntry(int curpos, bool isdel, Keys key)
	{
		string text = _GetOnlyNumbers();
		int length = text.Length;
		if (length == 0)
		{
			return;
		}
		string text2 = _Reverse(text);
		string text3 = "";
		if (length <= _frameslen)
		{
			text3 = text2;
		}
		else if (length == _frameslen + 1)
		{
			text3 = text2.Insert(_frameslen, _delimiter.ToString());
		}
		else
		{
			int num = (length - _frameslen) / _HMSlen;
			text3 = text2.Insert(_frameslen, _delimiter.ToString());
			int num2 = _frameslen;
			int num3 = 1;
			for (int i = 0; i < num; i++)
			{
				if (length > num2 + _HMSlen)
				{
					text3 = text3.Insert(num2 + _HMSlen + num3, _delimiter.ToString());
					num2 += 2;
					num3++;
				}
			}
		}
		_timecode.Text = _Reverse(text3);
		TextBox textBox = new TextBox();
		textBox.Text = _timecode.Text;
		if (curpos >= 0)
		{
			int j = 0;
			int num4 = textBox.TextLength;
			for (; j <= curpos; j++)
			{
				if (num4 < 0)
				{
					break;
				}
				textBox.Select(num4, 0);
				num4--;
			}
			if (key == Keys.Back)
			{
				_timecode.Select(textBox.SelectionStart, 0);
			}
			else if (isdel && textBox.SelectionStart == _timecode.TextLength && key == Keys.Back)
			{
				_timecode.Select(textBox.SelectionStart - 1, 0);
			}
			else if (isdel && textBox.SelectionStart == _timecode.TextLength && key == Keys.Delete)
			{
				_timecode.Select(textBox.SelectionStart - 1, 0);
			}
			else if (isdel && key == Keys.Delete)
			{
				if (textBox.SelectionStart - 2 >= 0 && _charDeleted)
				{
					_timecode.Select(textBox.SelectionStart - 2, 0);
					_charDeleted = false;
				}
				else if (textBox.SelectionStart - 1 >= 0)
				{
					_timecode.Select(textBox.SelectionStart - 1, 0);
				}
				else
				{
					_timecode.Select(textBox.SelectionStart, 0);
				}
			}
			else if (isdel)
			{
				_timecode.Select(textBox.SelectionStart, 0);
			}
			else
			{
				_timecode.Select(textBox.SelectionStart, 0);
			}
		}
		else
		{
			_timecode.Select(_timecode.TextLength, 0);
		}
	}

	private string _Reverse(string strToReverse)
	{
		string text = "";
		for (int num = strToReverse.Length - 1; num >= 0; num--)
		{
			text += strToReverse[num];
		}
		return text;
	}

	private string _GetOnlyNumbers()
	{
		string text = _timecode.Text;
		string text2 = "";
		for (int i = 0; i < text.Length; i++)
		{
			if (char.IsNumber(text[i]))
			{
				text2 += text[i];
			}
		}
		return text2;
	}

	private void _GetSelectionStart(int dupSelectStart, string[] intArray)
	{
		string text = "";
		for (int i = 0; i < _timecode.Text.Length - 1; i++)
		{
			text += intArray[i].ToString();
		}
		_timecode.Text = text;
		if (dupSelectStart == -1)
		{
			dupSelectStart = 0;
		}
		_timecode.SelectionStart = dupSelectStart;
	}

	private void _timecode_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Z && e.Control)
		{
			_Undo();
			return;
		}
		if (e.KeyCode == Keys.OemPipe && !_freeForm && (_timecode.SelectionLength == _timecode.TextLength || _timecode.Text == ""))
		{
			_timecode.Text = "";
			_freeForm = true;
			_needsFormatting = false;
			return;
		}
		if (e.Control || e.Shift)
		{
			e.Handled = true;
			return;
		}
		int num = 0;
		int num2 = 0;
		_needsFormatting = !_freeForm;
		if (e.KeyCode == Keys.Delete && _timecode.SelectionLength == 0 && _timecode.SelectionStart != 0)
		{
			if (_timecode.SelectionStart == _timecode.TextLength && (_timecode.Text[_timecode.SelectionStart - 1].ToString() == ":" || _timecode.Text[_timecode.SelectionStart - 1].ToString() == ";"))
			{
				num2 = _timecode.SelectionStart - 1;
				string[] array = new string[_timecode.Text.Length - 1];
				for (int i = 0; i < _timecode.Text.Length - 1; i++)
				{
					if (i == _timecode.SelectionStart)
					{
						num++;
					}
					else if (num > 0)
					{
						array[i - num] = _timecode.Text[i].ToString();
					}
					else
					{
						array[i] = _timecode.Text[i].ToString();
					}
				}
				_GetSelectionStart(num2, array);
			}
			else
			{
				if (_timecode.SelectionStart == _timecode.TextLength)
				{
					e.Handled = true;
					_needsFormatting = false;
					return;
				}
				if (_timecode.Text[_timecode.SelectionStart].ToString() == ":" || _timecode.Text[_timecode.SelectionStart].ToString() == ";")
				{
					num2 = _timecode.SelectionStart;
					string[] array = new string[_timecode.Text.Length - 1];
					for (int i = 0; i < _timecode.Text.Length; i++)
					{
						if (i == _timecode.SelectionStart + 1)
						{
							num++;
						}
						else if (num > 0)
						{
							array[i - num] = _timecode.Text[i].ToString();
							_charDeleted = true;
						}
						else
						{
							array[i] = _timecode.Text[i].ToString();
						}
					}
					_GetSelectionStart(num2, array);
				}
			}
		}
		if (e.KeyCode == Keys.Back && _timecode.SelectionLength == 0 && _timecode.SelectionStart != 0 && (_timecode.Text[_timecode.SelectionStart - 1].ToString() == ":" || _timecode.Text[_timecode.SelectionStart - 1].ToString() == ";"))
		{
			num2 = _timecode.SelectionStart - 1;
			string[] array = new string[_timecode.Text.Length - 1];
			for (int i = 0; i < _timecode.Text.Length; i++)
			{
				if (i == _timecode.SelectionStart - 2)
				{
					num++;
				}
				else if (num > 0)
				{
					array[i - num] = _timecode.Text[i].ToString();
				}
				else
				{
					array[i] = _timecode.Text[i].ToString();
				}
			}
			_GetSelectionStart(num2, array);
		}
		if (e.KeyCode == Keys.Return)
		{
			_FocusNextControl();
		}
		if (e.KeyCode == Keys.Escape)
		{
			_Undo();
		}
		if (!_freeForm)
		{
			if (e.KeyCode == Keys.Up)
			{
				e.Handled = true;
				_Scroll(isIncrement: false, 1);
			}
			else if (e.KeyCode == Keys.Down)
			{
				e.Handled = true;
				_Scroll(isIncrement: true, 1);
			}
			else if (e.KeyCode == Keys.Prior)
			{
				e.Handled = true;
				_Scroll(isIncrement: false, 10);
			}
			else if (e.KeyCode == Keys.Next)
			{
				e.Handled = true;
				_Scroll(isIncrement: true, 10);
			}
		}
	}

	private void _Scroll(bool isIncrement, int count)
	{
		if (_timecode.Text == "")
		{
			return;
		}
		_ReplaceDelimiter(Convert.ToChar(":"));
		Timecode timecode = new Timecode(_fps, 0);
		timecode.SetHMSF(_timecode.Text);
		if (isIncrement)
		{
			if (timecode.Frames != 0 && timecode.Frames - count >= 0)
			{
				timecode.Frames -= count;
			}
		}
		else
		{
			timecode.Frames += count;
		}
		if (_carry)
		{
			if (!_IsValidHour(timecode.GetHMSF()))
			{
				_Undo();
				return;
			}
		}
		else
		{
			if (_fps == 1000m && !_carry && _timecode.Text.Substring(_timecode.TextLength - _frameslen, _frameslen) == Convert.ToString(_fps - 1m) && !isIncrement)
			{
				_timecode.Text = _timecode.Text.Substring(0, _timecode.TextLength - _frameslen) + "000";
				return;
			}
			if (!_carry && _timecode.Text.Substring(_timecode.TextLength - _frameslen, _frameslen) == Convert.ToString(_fps - 1m) && !isIncrement)
			{
				_timecode.Text = _timecode.Text.Substring(0, _timecode.TextLength - _frameslen) + "00";
				return;
			}
		}
		_timecode.Text = timecode.GetHMSF();
		_timecode.Select(_timecode.TextLength, 0);
	}

	private bool _IsValidHour(string HMSF)
	{
		string[] array = HMSF.Split(new char[1] { ':' }, 2);
		if (Convert.ToInt32(array[0]) < 0 || Convert.ToInt32(array[0]) > 99)
		{
			return false;
		}
		return true;
	}

	private bool _IsValidChar(char c)
	{
		if (char.IsNumber(c))
		{
			return true;
		}
		switch (c)
		{
		case '\b':
		case '.':
		case ':':
		case ';':
			return true;
		default:
			return false;
		}
	}

	private void _ReplaceDelimiter(char chr)
	{
		_timecode.Text = _timecode.Text.Replace(_delimiter, chr);
		_delimiter = chr;
	}

	private void _AppendZeroes()
	{
		if (!_IsMaxLength())
		{
			string text = "00";
			if (_maxLength - _GetOnlyNumbers().Length == 1)
			{
				text = "0";
			}
			int curpos = _timecode.TextLength - _timecode.SelectionStart;
			int selectionStart = _timecode.SelectionStart;
			_timecode.Text = _timecode.Text.Insert(selectionStart, _delimiter + text);
			_FormatTCEntry(curpos, isdel: false, Keys.None);
		}
	}

	private void _timecode_KeyUp(object sender, KeyEventArgs e)
	{
		if (e.KeyData == Keys.Right || e.KeyData == Keys.Left || e.KeyData == Keys.OemSemicolon || e.KeyData == Keys.OemPeriod || e.KeyData == Keys.Tab || e.KeyData == Keys.Escape)
		{
			return;
		}
		if (e.Control || e.Shift || e.KeyData == Keys.ShiftKey || e.KeyData == Keys.ControlKey)
		{
			e.Handled = true;
		}
		else if (_needsFormatting)
		{
			if (e.KeyData == Keys.Delete || e.KeyData == Keys.Back)
			{
				_FormatTCEntry(_timecode.TextLength - _timecode.SelectionStart, isdel: true, e.KeyData);
			}
			else
			{
				_FormatTCEntry(_timecode.TextLength - _timecode.SelectionStart, isdel: false, e.KeyData);
			}
		}
	}

	private void _timecode_MouseDoubleClick(object sender, MouseEventArgs e)
	{
		_timecode.SelectionLength = 0;
		int curpos = _curpos;
		int num = 0;
		int num2 = _timecode.TextLength;
		if (curpos != _timecode.TextLength)
		{
			for (curpos = _curpos; curpos > 0; curpos--)
			{
				if (_timecode.Text[curpos].ToString() == ":" || _timecode.Text[curpos].ToString() == ";")
				{
					num = curpos + 1;
					break;
				}
			}
			for (curpos = _curpos; curpos <= _timecode.TextLength - 1; curpos++)
			{
				if (_timecode.Text[curpos].ToString() == ":" || _timecode.Text[curpos].ToString() == ";")
				{
					num2 = curpos - 1;
					break;
				}
			}
		}
		else if (curpos == _timecode.TextLength)
		{
			for (curpos = _curpos; curpos > 0; curpos--)
			{
				if (_timecode.Text[curpos - 1].ToString() == ":" || _timecode.Text[curpos - 1].ToString() == ";")
				{
					num = curpos;
					break;
				}
			}
		}
		_timecode.Select(num, num2 - num + 1);
	}

	private void _timecode_MouseClick(object sender, MouseEventArgs e)
	{
		_curpos = _timecode.SelectionStart;
	}

	private void NUDScroll_ValueChanged(object sender, EventArgs e)
	{
		if (!_freeForm)
		{
			if (_scrollOldValue < NUDScroll.Value)
			{
				_Scroll(isIncrement: false, 1);
			}
			else if (_scrollOldValue > NUDScroll.Value)
			{
				_Scroll(isIncrement: true, 1);
			}
			_scrollOldValue = NUDScroll.Value;
		}
	}

	private void TimecodeControl_Load(object sender, EventArgs e)
	{
		_scrollOldValue = 0m;
	}

	protected override void SetBoundsCore(int x, int y, int width, int height, BoundsSpecified specified)
	{
		int num = 119;
		int num2 = 23;
		base.SetBoundsCore(x, y, num, num2, specified);
	}

	private void TimecodeControl_Enter(object sender, EventArgs e)
	{
		_oldTCValue = _timecode.Text;
		_acceptButton = base.ParentForm.AcceptButton;
		base.ParentForm.AcceptButton = null;
	}

	private void NUDScroll_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Return)
		{
			_FocusNextControl();
		}
	}

	private void _FocusNextControl()
	{
		Control nextControl = base.ParentForm.GetNextControl(this, forward: true);
		if (nextControl != null)
		{
			nextControl.Focus();
			return;
		}
		_Validate();
		base.ParentForm.AcceptButton = _acceptButton;
	}
}
