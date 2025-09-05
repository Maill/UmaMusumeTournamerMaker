using Microsoft.EntityFrameworkCore;
using UmaMusumeTournamentMaker.API.Application.Extensions;
using UmaMusumeTournamentMaker.API.Application.Interfaces.Repositories;
using UmaMusumeTournamentMaker.API.Domain.Entities;
using UmaMusumeTournamentMaker.API.Infrastructure.Data;
using UmaMusumeTournamentMaker.API.Infrastructure.Extensions;

namespace UmaMusumeTournamentMaker.API.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for Tournament-specific operations
    /// Focused solely on tournament entity management and password verification
    /// </summary>
    public class TournamentRepository : ITournamentRepository
    {
        private readonly TournamentDbContext _context;

        public TournamentRepository(TournamentDbContext context)
        {
            _context = context;
        }

        public async Task<List<Tournament>> GetAllAsync()
        {
            return await _context.Tournaments
                //.WithPlayers()
                .ToListAsync();
        }

        public async Task<Tournament?> GetByIdAsync(int id)
        {
            return await _context.Tournaments
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Tournament?> GetByIdWithPlayersAsync(int id)
        {
            return await _context.Tournaments
                .WithPlayers()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Tournament?> GetByIdWithCompleteDetailsAsync(int id)
        {
            return await _context.Tournaments
                .WithCompleteDetails()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public Tournament Create(Tournament tournament)
        {
            _context.Tournaments.Add(tournament);
            return tournament;
        }

        public Tournament Update(Tournament tournament)
        {
            _context.Tournaments.Update(tournament);
            return tournament;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var tournament = await _context.Tournaments
                .WithFullDeletionGraph()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tournament == null)
                return false;

            _context.Tournaments.Remove(tournament);
            return true;
        }
    }
}