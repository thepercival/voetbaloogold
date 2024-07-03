function VoetbalOog_User_Factory()
{
	var instance = (function()
	{
		var m_arrPool = new Array();

		function privateMethod ()
		{
			// ...
		}

		return {
			createObjectsFromJSON: function ( oJSONs )
			{
				var arrObjects = new Object();

				for ( var nI in oJSONs )
				{
					if ( !( oJSONs.hasOwnProperty( nI ) ) )
						continue;

					var oJSON = oJSONs[nI];
					if ( oJSON == null )
						continue;
					else if ( typeof ( oJSON ) == 'number' )
						arrObjects[ oJSON ] = this.createObjectFromDatabase( oJSON );
					else
						arrObjects[ oJSON.Id ] = this.createObjectFromJSON( oJSON );
				}

				return arrObjects;
			}
			,
			createObjectFromJSON: function ( oJSON )
			{
				if ( oJSON == null )
					return null;

				var sId = oJSON.Id;
				var oObject = m_arrPool[sId];
				if ( oObject == null )
				{
					oObject = new VoetbalOog_User();
					m_arrPool[sId] = oObject;

					oObject.putId( sId );
					oObject.putName( oJSON.Name );
				}
				return oObject;
			}
			,
			createObjectFromDatabase: function ( nId )
			{
				if ( nId == null )
					return null;

				var oObject = m_arrPool[nId];
				if ( oObject == null )
				{
					alert('create with ajakkes user');
				}

				return oObject;
			}
		};
	})();

	VoetbalOog_User_Factory = function ()
	{
		// re-define the function for subsequent calls
		return instance;
	};

	return VoetbalOog_User_Factory();
}