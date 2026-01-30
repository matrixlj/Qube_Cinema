using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using QubeCinema.Boys;
using QubeStore.DAL;

namespace QubeStore;

public class Store : MarshalByRefObject, IQubeStore
{
	private static class QubeStoreFolder
	{
		public static string GetQubeStorePath(string mediaFolderPath)
		{
			return System.IO.Path.Combine(mediaFolderPath, "QubeStore");
		}

		public static string GetPath(string mediaFolderPath, QubeStoreFolderType qubeStoreFolder)
		{
			return System.IO.Path.Combine(mediaFolderPath, GetRelativePath(qubeStoreFolder));
		}

		public static string GetRelativePath(QubeStoreFolderType qubeStoreFolder)
		{
			return System.IO.Path.Combine("QubeStore", _GetSubFolderpath(qubeStoreFolder));
		}

		private static string _GetSubFolderpath(QubeStoreFolderType qubeStoreFolder)
		{
			string path = "Public";
			if (qubeStoreFolder == QubeStoreFolderType.Assets || qubeStoreFolder == QubeStoreFolderType.Scratch)
			{
				path = "Private";
			}
			return System.IO.Path.Combine(path, qubeStoreFolder.ToString());
		}
	}

	private class QuotaManager
	{
		private DBConnection _conxn;

		private int _id;

		public long GetTotalSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				return _GetTotalSpace(storeDataContext);
			}
		}

		public long GetUsedSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				return _GetUsedSpace(storeDataContext);
			}
		}

		public long GetFreeSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				return _GetTotalSpace(storeDataContext) - _GetUsedSpace(storeDataContext);
			}
		}

		public QuotaManager(DBConnection conxn, int qubeStoreId)
		{
			_conxn = conxn;
			_id = qubeStoreId;
		}

		public long GetTotalSpace(StoreDataContext storeDataContext, EntityType entityType)
		{
			lock (_conxn)
			{
				if (entityType.Percentage.HasValue)
				{
					long num = (long)entityType.Percentage.Value;
					return _GetTotalSpace(storeDataContext) * num / 100;
				}
				long num2 = _GetTotalSpace(storeDataContext);
				long num3 = _GetTotalReservedSpace(storeDataContext, num2);
				return num2 - num3;
			}
		}

		public long GetFreeSpace(StoreDataContext storeDataContext, EntityType entityType)
		{
			lock (_conxn)
			{
				long num = 0L;
				if (entityType.Percentage.HasValue)
				{
					num += GetUsedSpace(storeDataContext, entityType);
				}
				else
				{
					num += _GetTotalScratchSpace(storeDataContext);
					num += _GetTotalUnReservedUsedSpace(storeDataContext);
				}
				return GetTotalSpace(storeDataContext, entityType) - num;
			}
		}

		public long GetUsedSpace(StoreDataContext storeDataContext, EntityType entityType)
		{
			lock (_conxn)
			{
				IQueryable<Guid> source = (from ea in storeDataContext.EntityAssets
					where ea.Entity1.Type == entityType.Id && ea.Asset1.QubeStore == _id
					select ea.Asset).Distinct();
				if (source.Count() == 0)
				{
					return 0L;
				}
				IQueryable<long> source2 = from assetId in source
					from asset in storeDataContext.Assets
					where asset.Id == assetId
					select asset.Size;
				if (source2.Count() == 0)
				{
					return 0L;
				}
				return source2.Sum();
			}
		}

		private long _GetTotalSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				IQueryable<QubeStore.DAL.QubeStore> source = storeDataContext.QubeStores.Where((QubeStore.DAL.QubeStore qs) => qs.Id == _id);
				if (source.Count() > 0)
				{
					return source.Single().Quota;
				}
				throw new StoreNotExistsException(_id);
			}
		}

		private long _GetUsedSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				IQueryable<long> source = from asset in storeDataContext.Assets
					where asset.QubeStore == _id
					select asset.Size;
				long num = 0L;
				if (source.Count() > 0)
				{
					num += source.Sum();
				}
				return num + _GetTotalScratchSpace(storeDataContext);
			}
		}

		private long _GetTotalScratchSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				IQueryable<long> source = from scratch in storeDataContext.Scratches
					where scratch.QubeStore == _id
					select scratch.Size;
				if (source.Count() > 0)
				{
					return source.Sum();
				}
				return 0L;
			}
		}

		private long _GetTotalReservedSpace(StoreDataContext storeDataContext, long totalSpace)
		{
			lock (_conxn)
			{
				IQueryable<double?> source = from et in storeDataContext.EntityTypes
					where et.Percentage.HasValue
					select et.Percentage;
				if (source.Count() == 0)
				{
					return 0L;
				}
				long num = (long)source.Sum().Value;
				if (num > 100)
				{
					return totalSpace;
				}
				return totalSpace * num / 100;
			}
		}

		private long _GetTotalUnReservedUsedSpace(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				List<Guid> entityTypes = _GetUnReservedEntityTypeIds(storeDataContext);
				IQueryable<Guid> source = (from ea in storeDataContext.EntityAssets
					where entityTypes.Contains(ea.Entity1.Type) && ea.Asset1.QubeStore == _id
					select ea.Asset).Distinct();
				if (source.Count() == 0)
				{
					return 0L;
				}
				IQueryable<long> source2 = from assetId in source
					from asset in storeDataContext.Assets
					where asset.Id == assetId
					select asset.Size;
				if (source2.Count() == 0)
				{
					return 0L;
				}
				return source2.Sum();
			}
		}

		private List<Guid> _GetUnReservedEntityTypeIds(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				IQueryable<Guid> source = from et in storeDataContext.EntityTypes
					where !et.Percentage.HasValue
					select et.Id;
				if (source.Count() == 0)
				{
					return new List<Guid>();
				}
				return source.ToList();
			}
		}

		private List<EntityType> _GetEntityTypes(StoreDataContext storeDataContext)
		{
			lock (_conxn)
			{
				IQueryable<EntityType> source = storeDataContext.EntityTypes.Select((QubeStore.DAL.EntityType et) => new EntityType(et));
				if (source.Count() == 0)
				{
					return new List<EntityType>();
				}
				return source.ToList();
			}
		}
	}

	private int _id;

	private string _path;

	private long _quota;

	private QuotaManager _quotaManager;

	private DBConnection _dbConnection;

	public int Id => _id;

	public string Path => _path;

	public long Size => _quota;

	private Response _Add(StoreDataContext storeDataContext, Request request)
	{
		lock (_dbConnection)
		{
			if (!_IsDistributionVolumeExists(storeDataContext, request, out var distributionVol))
			{
				storeDataContext.DistributionVolumes.InsertOnSubmit(distributionVol);
			}
			if (!_IsEntityExist(storeDataContext, request, out var entity))
			{
				storeDataContext.Entities.InsertOnSubmit(entity);
			}
			Guid packingListId = Guid.Empty;
			QubeStore.DAL.Asset asset = null;
			if (request is CompositionRequest compositionRequest)
			{
				if (_IsAssetExist(storeDataContext, compositionRequest.CplFileRequest, out asset))
				{
					asset = null;
				}
				packingListId = (request as CompositionRequest).PackingList;
				if (!_IsPackingListCompositionExist(storeDataContext, packingListId, request.Id, out var packingListComposition))
				{
					entity.PackingListCompositions.Add(packingListComposition);
				}
			}
			else if (request is PackingListRequest)
			{
				packingListId = request.Id;
			}
			List<QubeStore.DAL.Asset> assets;
			List<QubeStore.DAL.Asset> assetsToCopy;
			List<QubeStore.DAL.Asset> externalAssets;
			List<EntityAsset> list = _GetEntityAssets(storeDataContext, request, out assets, out assetsToCopy, out externalAssets);
			if (asset != null)
			{
				assets.Add(asset);
			}
			if (list.Count > 0)
			{
				entity.EntityAssets.AddRange(list);
			}
			if (!_IsPackingListExist(storeDataContext, packingListId, request.DistributionId, out var packingList))
			{
				distributionVol.PackingLists.Add(packingList);
			}
			if (list != null)
			{
				storeDataContext.EntityAssets.InsertAllOnSubmit(list);
			}
			if (assets.Count > 0)
			{
				storeDataContext.Assets.InsertAllOnSubmit(assets);
				assetsToCopy.AddRange(assets);
			}
			if (externalAssets.Count > 0)
			{
				storeDataContext.Assets.InsertAllOnSubmit(externalAssets);
			}
			storeDataContext.SubmitChanges();
			return new Response(this, _GetSize(assets), assetsToCopy);
		}
	}

	private List<EntityAsset> _GetEntityAssets(StoreDataContext storeDataContext, Request request, out List<QubeStore.DAL.Asset> assets, out List<QubeStore.DAL.Asset> assetsToCopy, out List<QubeStore.DAL.Asset> externalAssets)
	{
		lock (_dbConnection)
		{
			assetsToCopy = new List<QubeStore.DAL.Asset>();
			assets = new List<QubeStore.DAL.Asset>();
			externalAssets = new List<QubeStore.DAL.Asset>();
			List<EntityAsset> entityAssets = new List<EntityAsset>();
			_AddAssets(storeDataContext, request, ref entityAssets, ref assetsToCopy, ref assets);
			_AddExternalAssets(storeDataContext, request, ref entityAssets, ref externalAssets);
			return entityAssets;
		}
	}

	private void _AddAssets(StoreDataContext storeDataContext, Request request, ref List<EntityAsset> entityAssets, ref List<QubeStore.DAL.Asset> assetsToCopy, ref List<QubeStore.DAL.Asset> assets)
	{
		foreach (AssetRequest value in request.Assets.Values)
		{
			if (!_IsEntityAssetExist(storeDataContext, request.Id, value.Id, out var entityAsset))
			{
				entityAssets.Add(entityAsset);
			}
			if (_IsAssetExist(storeDataContext, value, out var asset))
			{
				bool flag = _UpdateIfExternalAsset(value, ref asset);
				if (!_IsFilesExistsInFileSystem(asset, value, request) || flag)
				{
					assetsToCopy.Add(asset);
				}
			}
			else
			{
				assets.Add(asset);
			}
		}
	}

	private bool _UpdateIfExternalAsset(AssetRequest assetRequest, ref QubeStore.DAL.Asset asset)
	{
		if (asset.RelativePath == string.Empty || asset.Size <= 0)
		{
			string relativePath = QubeStoreFolder.GetRelativePath(QubeStoreFolderType.Assets);
			string path = assetRequest.Hash.ToHexString() + System.IO.Path.GetExtension(assetRequest.RelativePath);
			asset.RelativePath = System.IO.Path.Combine(relativePath, path);
			asset.Size = assetRequest.Size;
			return true;
		}
		return false;
	}

	private bool _IsFilesExistsInFileSystem(QubeStore.DAL.Asset asset, AssetRequest assetRequest, Request request)
	{
		string path = System.IO.Path.Combine(asset.QubeStore1.Path, asset.RelativePath);
		string path2 = System.IO.Path.Combine(QubeStoreFolder.GetPath(_path, QubeStoreFolderType.Packages), request.DistributionName);
		string path3 = System.IO.Path.Combine(path2, assetRequest.RelativePath);
		if (!File.Exists(path) || !File.Exists(path3))
		{
			return false;
		}
		return true;
	}

	private void _AddExternalAssets(StoreDataContext storeDataContext, Request request, ref List<EntityAsset> entityAssets, ref List<QubeStore.DAL.Asset> assets)
	{
		foreach (Guid externalAsset in request.ExternalAssets)
		{
			if (!_IsExternalAssetExist(storeDataContext, externalAsset, out var asset))
			{
				assets.Add(asset);
			}
			if (!_IsEntityAssetExist(storeDataContext, request.Id, externalAsset, out var entityAsset))
			{
				entityAssets.Add(entityAsset);
			}
		}
	}

	private bool _IsDistributionVolumeExists(StoreDataContext storeDataContext, Request request, out QubeStore.DAL.DistributionVolume distributionVol)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.DistributionVolume> source = storeDataContext.DistributionVolumes.Where((QubeStore.DAL.DistributionVolume dvol) => dvol.Id == request.DistributionId);
			if (source.Count() == 0)
			{
				distributionVol = new QubeStore.DAL.DistributionVolume();
				distributionVol.Id = request.DistributionId;
				distributionVol.Name = request.DistributionName;
				distributionVol.Path = System.IO.Path.Combine(QubeStoreFolder.GetPath(_path, QubeStoreFolderType.Packages), request.DistributionName);
				return false;
			}
			distributionVol = source.First();
			return true;
		}
	}

	private bool _IsPackingListExist(StoreDataContext storeDataContext, Guid packingListId, Guid distributionId, out QubeStore.DAL.PackingList packingList)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.PackingList> source = storeDataContext.PackingLists.Where((QubeStore.DAL.PackingList pkList) => pkList.Id == packingListId);
			if (source.Count() == 0)
			{
				packingList = new QubeStore.DAL.PackingList();
				packingList.Id = packingListId;
				packingList.DistributionVolume = distributionId;
				return false;
			}
			packingList = source.First();
			return true;
		}
	}

	private bool _IsEntityExist(StoreDataContext storeDataContext, Request request, out QubeStore.DAL.Entity entity)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.Entity> source = storeDataContext.Entities.Where((QubeStore.DAL.Entity ent) => ent.Id == request.Id);
			bool flag = request.Type.Name.ToLower() != "scratch";
			if (source.Count() == 0)
			{
				entity = _CreateEntity(request.Id, request.Name, request.Type.Id, flag);
				return false;
			}
			entity = source.First();
			entity.WIP = flag;
			return true;
		}
	}

	private bool _IsPackingListCompositionExist(StoreDataContext storeDataContext, Guid packingListId, Guid compositionId, out PackingListComposition packingListComposition)
	{
		lock (_dbConnection)
		{
			packingListComposition = null;
			IQueryable<PackingListComposition> source = storeDataContext.PackingListCompositions.Where((PackingListComposition pc) => pc.PackingList == packingListId && pc.Composition == compositionId);
			if (source.Count() == 0)
			{
				packingListComposition = new PackingListComposition();
				packingListComposition.PackingList = packingListId;
				packingListComposition.Composition = compositionId;
				return false;
			}
			packingListComposition = source.First();
			return true;
		}
	}

	private bool _IsEntityAssetExist(StoreDataContext storeDataContext, Guid entityId, Guid assetId, out EntityAsset entityAsset)
	{
		lock (_dbConnection)
		{
			IQueryable<EntityAsset> source = storeDataContext.EntityAssets.Where((EntityAsset ea) => ea.Entity == entityId && ea.Asset == assetId);
			if (source.Count() == 0)
			{
				entityAsset = new EntityAsset();
				entityAsset.Asset = assetId;
				entityAsset.Entity = entityId;
				return false;
			}
			entityAsset = source.First();
			return true;
		}
	}

	private bool _IsAssetExist(StoreDataContext storeDataContext, AssetRequest assetRequest, out QubeStore.DAL.Asset asset)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.Asset> source = storeDataContext.Assets.Where((QubeStore.DAL.Asset at) => at.Id == assetRequest.Id);
			if (source.Count() == 0)
			{
				asset = _CreateAsset(assetRequest);
				return false;
			}
			asset = source.First();
			return true;
		}
	}

	private bool _IsExternalAssetExist(StoreDataContext storeDataContext, Guid assetId, out QubeStore.DAL.Asset asset)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.Asset> source = storeDataContext.Assets.Where((QubeStore.DAL.Asset at) => at.Id == assetId);
			if (source.Count() == 0)
			{
				asset = _CreateExternalAsset(assetId);
				return false;
			}
			asset = source.First();
			return true;
		}
	}

	private QubeStore.DAL.Entity _CreateEntity(Guid id, string name, Guid type, bool wip)
	{
		QubeStore.DAL.Entity entity = new QubeStore.DAL.Entity();
		entity.Id = id;
		entity.Name = name;
		entity.Type = type;
		entity.LastAccessed = DateTime.Now;
		entity.AccessCount = 0;
		entity.WIP = wip;
		return entity;
	}

	private QubeStore.DAL.Asset _CreateExternalAsset(Guid assetId)
	{
		QubeStore.DAL.Asset asset = new QubeStore.DAL.Asset();
		asset.Id = assetId;
		asset.QubeStore = _id;
		asset.Size = 0L;
		asset.RelativePath = string.Empty;
		return asset;
	}

	private QubeStore.DAL.Asset _CreateAsset(AssetRequest assetRequest)
	{
		QubeStore.DAL.Asset asset = new QubeStore.DAL.Asset();
		asset.Id = assetRequest.Id;
		asset.QubeStore = _id;
		asset.Size = assetRequest.Size;
		string relativePath = QubeStoreFolder.GetRelativePath(QubeStoreFolderType.Assets);
		string path = assetRequest.Hash.ToHexString() + System.IO.Path.GetExtension(assetRequest.RelativePath);
		asset.RelativePath = System.IO.Path.Combine(relativePath, path);
		return asset;
	}

	private long _GetSize(List<QubeStore.DAL.Asset> assetsAdded)
	{
		long num = 0L;
		foreach (QubeStore.DAL.Asset item in assetsAdded)
		{
			num += item.Size;
		}
		return num;
	}

	internal Guid ReserveScratchSpace(string scratchFolder, long size)
	{
		if (size < 0)
		{
			throw new ArgumentException("Bytes to reserve can't be negative", "size");
		}
		StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
		lock (_dbConnection)
		{
			QubeStore.DAL.Entity entity;
			bool flag = _IsScratchEntityExists(storeDataContext, scratchFolder, out entity);
			long num = size;
			if (entity.Scratch != null)
			{
				num -= entity.Scratch.Size;
			}
			if (num < 0)
			{
				throw new Exception($"Could not update folder size less than {entity.Scratch.Size}.");
			}
			if (num > 0)
			{
				EntityType entityTypeByName = QubeStoreHelper.GetEntityTypeByName(storeDataContext, "scratch");
				long freeSpace = _quotaManager.GetFreeSpace(storeDataContext, entityTypeByName);
				if (num > freeSpace)
				{
					throw new InsufficientSpaceException(num, freeSpace, "scratch");
				}
			}
			if (!flag)
			{
				storeDataContext.Entities.InsertOnSubmit(entity);
			}
			if (!_IsScratchExists(storeDataContext, scratchFolder, entity.Id, out var scratch))
			{
				storeDataContext.Scratches.InsertOnSubmit(scratch);
			}
			_UpdateScratch(entity, scratch, size);
			storeDataContext.SubmitChanges();
			return entity.Id;
		}
	}

	internal Scratch GetScratch(string scratchFolder)
	{
		StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
		lock (_dbConnection)
		{
			if (_IsScratchEntityExists(storeDataContext, scratchFolder, out var entity))
			{
				return entity.Scratch;
			}
		}
		throw new ScratchNotFoundException(scratchFolder);
	}

	private void _UpdateScratch(QubeStore.DAL.Entity scratchEntity, Scratch scratch, long size)
	{
		scratchEntity.LastAccessed = DateTime.Now;
		scratchEntity.AccessCount++;
		scratch.Size = size;
	}

	private bool _IsScratchExists(StoreDataContext storeDataContext, string folder, Guid entity, out Scratch scratch)
	{
		lock (_dbConnection)
		{
			IQueryable<Scratch> source = storeDataContext.Scratches.Where((Scratch sc) => sc.Entity == entity);
			if (source.Count() == 0)
			{
				scratch = _CreateScratch(entity, folder);
				return false;
			}
			scratch = source.First();
			return true;
		}
	}

	private bool _IsScratchEntityExists(StoreDataContext storeDataContext, string scratchFolder, out QubeStore.DAL.Entity entity)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.Entity> source = storeDataContext.Entities.Where((QubeStore.DAL.Entity sc) => sc.Name.ToLower() == scratchFolder.ToLower());
			if (source.Count() == 0)
			{
				EntityType entityTypeByName = QubeStoreHelper.GetEntityTypeByName(storeDataContext, "scratch");
				entity = _CreateEntity(Guid.NewGuid(), scratchFolder, entityTypeByName.Id, wip: false);
				return false;
			}
			entity = source.First();
			return true;
		}
	}

	private Scratch _CreateScratch(Guid entity, string folderName)
	{
		Scratch scratch = new Scratch();
		scratch.Entity = entity;
		scratch.Folder = folderName;
		scratch.QubeStore = Id;
		scratch.Size = 0L;
		return scratch;
	}

	private bool _IsSourceFromScratch(StoreDataContext storeDataContext, string sourcePath, out Scratch scratch)
	{
		lock (_dbConnection)
		{
			IQueryable<Scratch> source = storeDataContext.Scratches.Select((Scratch sc) => sc);
			sourcePath = sourcePath.ToLower();
			scratch = null;
			foreach (Scratch item in source.ToList())
			{
				if (sourcePath.StartsWith(item.Folder.ToLower()))
				{
					scratch = item;
					break;
				}
			}
			return scratch != null;
		}
	}

	public override object InitializeLifetimeService()
	{
		return null;
	}

	internal Store(DBConnection dbConnection, QubeStore.DAL.QubeStore qubeStore)
	{
		_dbConnection = dbConnection;
		_id = qubeStore.Id;
		_path = qubeStore.Path;
		_quota = qubeStore.Quota;
		_quotaManager = new QuotaManager(_dbConnection, _id);
	}

	public string GetFolder(QubeStoreFolderType folderType)
	{
		return QubeStoreFolder.GetPath(_path, folderType);
	}

	public long GetTotalSpace(EntityType entityType)
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetTotalSpace(storeDataContext, entityType);
		}
	}

	public long GetUsedSpace(EntityType entityType)
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetUsedSpace(storeDataContext, entityType);
		}
	}

	public long GetFreeSpace(EntityType entityType)
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetFreeSpace(storeDataContext, entityType);
		}
	}

	public long GetTotalSpace()
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetTotalSpace(storeDataContext);
		}
	}

	public long GetUsedSpace()
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetUsedSpace(storeDataContext);
		}
	}

	public long GetFreeSpace()
	{
		lock (_dbConnection)
		{
			StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
			return _quotaManager.GetFreeSpace(storeDataContext);
		}
	}

	public Response Add(Request request)
	{
		StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
		lock (_dbConnection)
		{
			if (!_IsExist(storeDataContext, request))
			{
				long requestSize = request.GetRequestSize(storeDataContext);
				if (requestSize > 0)
				{
					if (_IsSourceFromScratch(storeDataContext, request.Assets.First().Value.Sourcepath, out var scratch))
					{
						scratch.Size = 0L;
					}
					else
					{
						long num = _GetFreeSpace(storeDataContext, request);
						if (requestSize > num)
						{
							throw new InsufficientSpaceException(requestSize, num, request.Type.Name);
						}
					}
				}
			}
			return _Add(storeDataContext, request);
		}
	}

	public Asset GetAsset(Guid id)
	{
		StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
		lock (_dbConnection)
		{
			return QubeStoreHelper.GetAsset(storeDataContext, id);
		}
	}

	internal bool IsReferred(out List<string> referredTypes)
	{
		StoreDataContext storeDataContext = QubeStoreHelper.GetStoreDataContext(_dbConnection);
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.EntityType> source = (from ea in storeDataContext.EntityAssets
				where ea.Asset1.QubeStore == Id
				select ea.Entity1.EntityType).Distinct();
			referredTypes = new List<string>();
			bool result = false;
			if (source.Count() > 0)
			{
				result = true;
				foreach (QubeStore.DAL.EntityType item in source.ToList())
				{
					EntityType entityType = new EntityType(item);
					if (!referredTypes.Contains(entityType.Category))
					{
						referredTypes.Add(entityType.Category);
					}
				}
			}
			if (_IsReferredByScratch(storeDataContext))
			{
				result = true;
				referredTypes.Add("scratch");
			}
			return result;
		}
	}

	private bool _IsReferredByScratch(StoreDataContext storeDataContext)
	{
		lock (_dbConnection)
		{
			IQueryable<Scratch> source = storeDataContext.Scratches.Where((Scratch sc) => sc.QubeStore == _id);
			if (source.Count() > 0)
			{
				return true;
			}
			return false;
		}
	}

	private bool _IsExist(StoreDataContext storeDataContext, Request request)
	{
		lock (_dbConnection)
		{
			IQueryable<QubeStore.DAL.Entity> source = storeDataContext.Entities.Where((QubeStore.DAL.Entity cpl) => cpl.Id == request.Id);
			if (source.Count() == 0)
			{
				return false;
			}
			return true;
		}
	}

	private long _GetFreeSpace(StoreDataContext storeDataContext, Request request)
	{
		lock (_dbConnection)
		{
			if (request is CompositionRequest)
			{
				return _quotaManager.GetFreeSpace(storeDataContext, (request as CompositionRequest).Type);
			}
			return _quotaManager.GetFreeSpace(storeDataContext);
		}
	}
}
