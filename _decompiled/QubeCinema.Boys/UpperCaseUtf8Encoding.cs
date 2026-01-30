using System.Text;

namespace QubeCinema.Boys;

public class UpperCaseUtf8Encoding : UTF8Encoding
{
	public override string WebName => base.WebName.ToUpper();
}
