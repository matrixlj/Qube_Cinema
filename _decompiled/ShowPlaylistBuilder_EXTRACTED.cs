// =======================================================================================
// EXTRACTED FROM: ASDCPHandler.dll
// CLASS: ShowPlaylistBuilder
// PURPOSE: Writes Show Playlist (SPL) XML files to disk
// =======================================================================================
//
// FLOW DIAGRAM:
// 
// SaveShowPlaylist (in DCPEntityServiceProvider)
//   └─> new ShowPlaylistBuilder(showLE, playCueEvents, _database, isSplVersion5_0_3)
//       └─> Serialize()
//           ├─> _GetShowPath() --> Returns disk path where SPL will be written
//           │   └─> mediaFolders[0].Path + "\QubeStore\Public\Shows\" + showName + "\" + showName + ".spl.xml"
//           │
//           └─> XmlTextWriter(filename) --> WRITES SPL TO DISK
//               ├─> Serializer.Serialize(_GetSPL())         [if SPL version 5.0.3]
//               └─> Serializer.Serialize(_GetSPL_3_0())     [if SPL version 3.0]
//
// =======================================================================================

namespace QubeCinema.ASDCP
{
	internal class ShowPlaylistBuilder
	{
		private ShowBuilderLE _show;
		private DBConnection _conxn;
		private bool _isSplVersion5_0_3;
		private Dictionary<Guid, List<Qube.PlaylistCueEvent>> _playlistCueEvents;

		public ShowPlaylistBuilder(ShowBuilderLE show, Dictionary<Guid, List<Qube.PlaylistCueEvent>> playlistCueEvents, DBConnection conxn, bool isSplVersion5_0_3)
		{
			_show = show;
			_conxn = conxn;
			_playlistCueEvents = playlistCueEvents;
			_isSplVersion5_0_3 = isSplVersion5_0_3;
		}

		// =======================================================================================
		// MAIN METHOD: Serialize()
		// WRITES SPL FILE TO DISK
		// =======================================================================================
		public void Serialize()
		{
			// 1. Get the full path where SPL will be written
			string filename = _GetShowPath(_show, _conxn);
			
			// 2. Create XmlTextWriter for the file (UTF-8 encoding without BOM)
			using XmlTextWriter writer = new XmlTextWriter(filename, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
			
			// 3. Serialize to XML based on SPL version
			if (_isSplVersion5_0_3)
			{
				Serializer.Serialize(writer, _GetSPL());      // SPL Version 5.0.3
			}
			else
			{
				Serializer.Serialize(writer, _GetSPL_3_0());  // SPL Version 3.0
			}
		}

		// =======================================================================================
		// PATH CONSTRUCTION METHOD: _GetShowPath()
		// RETURNS: Full path to SPL file on disk
		// EXAMPLE: C:\MediaFolder\QubeStore\Public\Shows\MyShow\MyShow.spl.xml
		// =======================================================================================
		private string _GetShowPath(ShowBuilderLE show, DBConnection conxn)
		{
			// 1. Get media folders from database
			MediaFolders mediaFolders = Qube.DAL.MediaFolder.GetMediaFolders(conxn);
			
			if (mediaFolders.Count > 0)
			{
				// 2. Construct base path: mediaFolder[0].Path + "\QubeStore\Public\Shows"
				string path = Path.Combine(mediaFolders[0].Path, QubeStoreFolder.GetRelativePath(QubeStoreFolders.Shows));
				
				// 3. Verify show exists in database
				Qube.DAL.Show.GetShow(_conxn, show.Id);
				
				// 4. Create show subdirectory: basePath + "\ShowName"
				string text = Path.Combine(path, show.Name);
				if (!Directory.Exists(text))
				{
					Directory.CreateDirectory(text);  // Create directory if doesn't exist
				}
				
				// 5. Return full SPL file path: showDirectory + "\ShowName.spl.xml"
				return Path.Combine(text, show.Name + ".spl.xml");
			}
			
			throw new Exception("Media folder not found");
		}

		// =======================================================================================
		// SPL GENERATION METHOD (Version 5.0.3)
		// RETURNS: SMPTE.SPL.ShowPlaylist object ready for serialization
		// =======================================================================================
		private SMPTE.SPL.ShowPlaylist _GetSPL()
		{
			SMPTE.SPL.ShowPlaylist showPlaylist = new SMPTE.SPL.ShowPlaylist();
			showPlaylist.Id = _show.Id.ToString();
			showPlaylist.ArrangementId = _show.Id.ToString();
			showPlaylist.ShowTitleText = _show.Name;
			showPlaylist.CreationTimestamp = DateTime.Now;
			showPlaylist.Show = new SMPTE.SPL.ShowType();
			
			// Add all composition playlists (titles) to the show
			foreach (PlayTitleEventLE item in _show.PlayTitleEventsLE)
			{
				showPlaylist.Show.CompositionPlaylistCollection.Add(_GetCompositionPlaylistType(item));
			}
			
			return showPlaylist;
		}

		// =======================================================================================
		// COMPOSITION PLAYLIST BUILDER (Version 5.0.3)
		// =======================================================================================
		private SMPTE.SPL.CompositionPlaylistType _GetCompositionPlaylistType(PlayTitleEventLE playTitleEvent)
		{
			SMPTE.SPL.CompositionPlaylistType compositionPlaylistType = new SMPTE.SPL.CompositionPlaylistType();
			compositionPlaylistType.Id = playTitleEvent.Id.ToString();
			compositionPlaylistType.CompositionPlaylist = playTitleEvent.TitleId;
			compositionPlaylistType.Title = playTitleEvent.TitleName;
			compositionPlaylistType.AnnotationText = $"{playTitleEvent.TitleName}_{playTitleEvent.TitleType}";
			compositionPlaylistType.EstimatedDuration = playTitleEvent.TitleDuration;
			return compositionPlaylistType;
		}

		// =======================================================================================
		// SPL GENERATION METHOD (Version 3.0 - Legacy)
		// RETURNS: SMPTE.SPL_3_0.ShowPlaylistType object ready for serialization
		// =======================================================================================
		private SMPTE.SPL_3_0.ShowPlaylistType _GetSPL_3_0()
		{
			SMPTE.SPL_3_0.ShowPlaylistType showPlaylistType = new SMPTE.SPL_3_0.ShowPlaylistType();
			showPlaylistType.Id = Qube.MpegII.Convert.ToUrnUuid(_show.Id);
			showPlaylistType.IssueDate = DateTime.Now;
			showPlaylistType.AnnotationText = _GetUserTextType(_show.Name);
			showPlaylistType.ShowTitleText = _GetUserTextType(_show.Name);
			showPlaylistType.PackList = _GetPackList();
			showPlaylistType.Creator = _GetUserTextType("Qube Cinema");
			showPlaylistType.Issuer = _GetUserTextType("Qube Cinema");
			return showPlaylistType;
		}

		// =======================================================================================
		// PACK LIST BUILDER (Version 3.0)
		// =======================================================================================
		private ShowPlaylistTypePackList _GetPackList()
		{
			ShowPlaylistTypePackList showPlaylistTypePackList = new ShowPlaylistTypePackList();
			List<object> list = new List<object>();
			
			foreach (PlayTitleEventLE item in _show.PlayTitleEventsLE)
			{
				list.Add(_GetPackListInternalType(item));
			}
			
			showPlaylistTypePackList.Items = list.ToArray();
			return showPlaylistTypePackList;
		}

		// =======================================================================================
		// PACK BUILDER (Version 3.0)
		// =======================================================================================
		private PlaylistPackInternalType _GetPackListInternalType(PlayTitleEventLE playTitleEvent)
		{
			PlaylistPackInternalType playlistPackInternalType = new PlaylistPackInternalType();
			playlistPackInternalType.AnnotationText = _GetUserTextType(playTitleEvent.TitleName);
			playlistPackInternalType.Id = Qube.MpegII.Convert.ToUrnUuid(Guid.NewGuid());
			playlistPackInternalType.PlaylistPackKind = _GetPlaylistPackKind(playTitleEvent.TitleType);
			playlistPackInternalType.Playlist = _GetPlaylistType(playTitleEvent);
			return playlistPackInternalType;
		}

		// =======================================================================================
		// PLAYLIST BUILDER WITH CUE EVENTS (Version 3.0)
		// =======================================================================================
		private PlaylistType _GetPlaylistType(PlayTitleEventLE playTitleEvent)
		{
			PlaylistType playlistType = new PlaylistType();
			List<PlaylistMarkerType> list = new List<PlaylistMarkerType>();
			
			// Add cue events (markers) if present
			if (_playlistCueEvents.ContainsKey(playTitleEvent.Id))
			{
				List<Qube.PlaylistCueEvent> list2 = _playlistCueEvents[playTitleEvent.Id];
				foreach (Qube.PlaylistCueEvent item in list2)
				{
					list.Add(_GetMarkerType(item));
				}
			}
			
			// Set composition playlist ID
			List<string> list3 = new List<string>();
			list3.Add(Qube.MpegII.Convert.ToUrnUuid(new Guid(playTitleEvent.TitleId)));
			
			List<ItemsChoiceType1> list4 = new List<ItemsChoiceType1>();
			list4.Add(ItemsChoiceType1.CompositionPlaylistId);
			
			playlistType.PlaylistMarker = list.ToArray();
			playlistType.Items = list3.ToArray();
			playlistType.ItemsElementName = list4.ToArray();
			
			return playlistType;
		}

		// =======================================================================================
		// MARKER (CUE EVENT) BUILDER (Version 3.0)
		// =======================================================================================
		private PlaylistMarkerType _GetMarkerType(Qube.PlaylistCueEvent cueEvent)
		{
			PlaylistMarkerType playlistMarkerType = new PlaylistMarkerType();
			playlistMarkerType.AnnotationText = _GetUserTextType(cueEvent.Kind);
			playlistMarkerType.Id = Qube.MpegII.Convert.ToUrnUuid(cueEvent.Id);
			playlistMarkerType.Label = _GetMarkerTypeLabel(cueEvent.Action);
			playlistMarkerType.Offset = _GetMarkerTypeOffset(cueEvent.Offset);
			return playlistMarkerType;
		}

		// =======================================================================================
		// HELPER METHODS (Version 3.0)
		// =======================================================================================
		private UserTextType _GetUserTextType(string value)
		{
			UserTextType userTextType = new UserTextType();
			userTextType.Value = value;
			return userTextType;
		}

		private PlaylistMarkerTypeLabel _GetMarkerTypeLabel(string value)
		{
			PlaylistMarkerTypeLabel playlistMarkerTypeLabel = new PlaylistMarkerTypeLabel();
			playlistMarkerTypeLabel.Value = value;
			return playlistMarkerTypeLabel;
		}

		private PlaylistMarkerTypeOffset _GetMarkerTypeOffset(decimal value)
		{
			PlaylistMarkerTypeOffset playlistMarkerTypeOffset = new PlaylistMarkerTypeOffset();
			playlistMarkerTypeOffset.Value = (ulong)(value * 24m);  // Convert to frames at 24 fps
			long[] editRate = new long[2] { 24L, 1L };              // 24 fps edit rate
			playlistMarkerTypeOffset.EditRate = editRate;
			return playlistMarkerTypeOffset;
		}

		private PlaylistPackInternalTypePlaylistPackKind _GetPlaylistPackKind(string value)
		{
			PlaylistPackInternalTypePlaylistPackKind playlistPackInternalTypePlaylistPackKind = new PlaylistPackInternalTypePlaylistPackKind();
			playlistPackInternalTypePlaylistPackKind.Value = value;
			return playlistPackInternalTypePlaylistPackKind;
		}
	}
}


// =======================================================================================
// SUMMARY OF SPL DISK WRITE MECHANISM
// =======================================================================================
//
// 1. ENTRY POINT: DCPEntityServiceProvider.SaveShowPlaylist()
//    - Called from: Catalog.asmx _SaveShowPlaylist() method
//    - Parameters: ShowBuilderLE, Dictionary<Guid, List<PlaylistCueEvent>>, bool isSplVersion5_0_3
//
// 2. INSTANTIATION: new ShowPlaylistBuilder(...)
//    - Creates builder with show data, cue events, DB connection, version flag
//
// 3. SERIALIZATION: ShowPlaylistBuilder.Serialize()
//    a) _GetShowPath() constructs file path:
//       - Queries DB for media folder path
//       - Combines: mediaFolder[0].Path + "\QubeStore\Public\Shows\" + showName
//       - Creates directory if not exists
//       - Returns: fullPath + "\showName.spl.xml"
//    
//    b) Creates XmlTextWriter with UTF-8 encoding
//    
//    c) Calls Serializer.Serialize() with:
//       - _GetSPL() for version 5.0.3 format
//       - _GetSPL_3_0() for legacy 3.0 format
//
// 4. DISK WRITE: XmlTextWriter writes XML to file system
//    - File location: C:\MediaFolder\QubeStore\Public\Shows\ShowName\ShowName.spl.xml
//    - Format: SMPTE-compliant Show Playlist XML
//    - Encoding: UTF-8 without BOM
//
// =======================================================================================
