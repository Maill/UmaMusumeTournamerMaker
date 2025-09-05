using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UmaMusumeTournamentMaker.API.Domain.Entities;

namespace UmaMusumeTournamentMaker.API.Application.Interfaces
{
    public interface ICacheService
    {
        void SetTournament(Tournament tournament);

        Tournament? GetTournament(int id);

        bool AddPlayerToTournament(int tournamentId, Player player);

        bool RemovePlayerFromTournament(int tournamentId, int id);

        void UpdateTournament(Tournament tournament);

        void RemoveTournament(int tournamentId);
    }
}
