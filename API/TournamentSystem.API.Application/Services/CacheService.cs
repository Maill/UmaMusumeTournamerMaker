using Microsoft.Extensions.Caching.Memory;
using System.Numerics;
using UmaMusumeTournamentMaker.API.Application.Extensions;
using UmaMusumeTournamentMaker.API.Application.Interfaces;
using UmaMusumeTournamentMaker.API.Domain.Entities;

namespace UmaMusumeTournamentMaker.API.Application.Services
{
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly MemoryCacheEntryOptions _cacheOptions = new ()
        {
            SlidingExpiration = TimeSpan.FromMinutes(20), // Extends on each access
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(2) // Maximum lifetime
        };

        public CacheService(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }

        public bool AddPlayerToTournament(int tournamentId, Player player)
        {
            if (_memoryCache.TryGetValue(tournamentId, out Tournament? tournament))
            {
                tournament!.Players.Add(player);

                _memoryCache.Set(tournament.Id, tournament, _cacheOptions);

                return true;
            }

            return false;
        }

        public bool RemovePlayerFromTournament(int tournamentId, int id)
        {
            if (_memoryCache.TryGetValue(tournamentId, out Tournament? tournament))
            {
                tournament!.Players = tournament!.Players.Where(p => p.Id != id).ToList();

                _memoryCache.Set(tournament.Id, tournament, _cacheOptions);

                return true;
            }

            return false;
        }

        public Tournament? GetTournament(int id)
        {
            if (_memoryCache.TryGetValue(id, out Tournament? tournament))
            {
                return tournament;
            }

            return null;
        }

        public void SetTournament(Tournament tournament)
        {
            if (!_memoryCache.TryGetValue(tournament.Id, out _))
            {
                _memoryCache.Set(tournament.Id, tournament, _cacheOptions);
            }
        }

        public void UpdateTournament(Tournament tournament)
        {
            if (_memoryCache.TryGetValue(tournament.Id, out _))
            {
                _memoryCache.Set(tournament.Id, tournament, _cacheOptions);
            }
        }

        public void RemoveTournament(int tournamentId)
        {
            if (_memoryCache.TryGetValue(tournamentId, out _))
            {
                _memoryCache.Remove(tournamentId);
            }
        }
    }
}
