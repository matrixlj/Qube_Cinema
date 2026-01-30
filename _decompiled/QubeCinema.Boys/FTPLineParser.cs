using System;
using System.Text.RegularExpressions;

namespace QubeCinema.Boys;

public class FTPLineParser
{
	private Regex unixStyle = new Regex("^(?<dir>[-dl])(?<ownerSec>[-r][-w][-x])(?<groupSec>[-r][-w][-x])(?<everyoneSec>[-r][-w][-x])\\s+(?:\\d+)\\s+(?<owner>\\w+)\\s+(?<group>\\w+)\\s+(?<size>\\d+)\\s+(?<month>\\w+)\\s+(?<day>\\d{1,2})\\s+(?<hour>\\d{1,2}):(?<minutes>\\d{1,2})\\s+(?<name>.*)$", RegexOptions.IgnoreCase);

	private Regex unixStyle2 = new Regex("^(?<dir>[-dl])(?<ownerSec>[-r][-w][-x])(?<groupSec>[-r][-w][-x])(?<everyoneSec>[-r][-w][-x])\\s+(\\d+)\\s+(?<owner>\\w+)\\s+(?<group>\\w+)\\s+(?<size>\\d+)\\s+(?<month>\\w+)\\s+(?<day>\\d{1,2})\\s+(?<Year>\\w+)\\s+(?<name>.*)$", RegexOptions.IgnoreCase);

	private Regex winStyle = new Regex("^(?<month>\\d{1,2})-(?<day>\\d{1,2})-(?<year>\\d{1,2})\\s+(?<hour>\\d{1,2}):(?<minutes>\\d{1,2})(?<ampm>am|pm)\\s+(?<dir>[<]dir[>])?\\s+(?<size>\\d+)?\\s+(?<name>.*)$", RegexOptions.IgnoreCase);

	public FTPLineResult Parse(string line)
	{
		Match match = unixStyle.Match(line);
		if (match.Success)
		{
			return ParseMatch(match.Groups, DirectoryListingStyle.Unix);
		}
		match = unixStyle2.Match(line);
		if (match.Success)
		{
			return ParseMatch(match.Groups, DirectoryListingStyle.Unix);
		}
		match = winStyle.Match(line);
		if (match.Success)
		{
			return ParseMatch(match.Groups, DirectoryListingStyle.Windows);
		}
		throw new Exception("Invalid FTP line format");
	}

	private FTPLineResult ParseMatch(GroupCollection matchGroups, DirectoryListingStyle style)
	{
		string value = ((style == DirectoryListingStyle.Unix) ? "d" : "<dir>");
		FTPLineResult fTPLineResult = new FTPLineResult();
		fTPLineResult.Style = style;
		fTPLineResult.IsDirectory = matchGroups["dir"].Value.Equals(value, StringComparison.InvariantCultureIgnoreCase);
		fTPLineResult.Name = matchGroups["name"].Value;
		if (!fTPLineResult.IsDirectory)
		{
			long.TryParse(matchGroups["size"].Value, out fTPLineResult.Size);
		}
		return fTPLineResult;
	}
}
