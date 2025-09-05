using UmaMusumeTournamentMaker.API.Domain.Entities;

namespace UmaMusumeTournamentMaker.API.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Tournament-specific operations
    /// Handles only tournament entity CRUD and password verification
    /// </summary>
    public interface ITournamentRepository
    {
        /// <summary>
        /// Gets all tournaments with basic player data
        /// </summary>
        Task<List<Tournament>> GetAllAsync();

        /// <summary>
        /// Gets tournament by ID
        /// </summary>
        Task<Tournament?> GetByIdAsync(int id);

        /// <summary>
        /// Gets tournament by ID with players included
        /// </summary>
        Task<Tournament?> GetByIdWithPlayersAsync(int id);

        /// <summary>
        /// Gets tournament by ID with complete details (players, rounds, matches)
        /// </summary>
        Task<Tournament?> GetByIdWithCompleteDetailsAsync(int id);

        /// <summary>
        /// Creates a new tournament
        /// </summary>
        Tournament Create(Tournament tournament);

        /// <summary>
        /// Updates an existing tournament
        /// </summary>
        Tournament Update(Tournament tournament);

        /// <summary>
        /// Deletes a tournament with all related data
        /// </summary>
        Task<bool> DeleteAsync(int id);
    }
}