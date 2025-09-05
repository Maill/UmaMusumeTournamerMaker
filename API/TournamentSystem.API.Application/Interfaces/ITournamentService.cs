using UmaMusumeTournamentMaker.API.Application.DTOs;

namespace UmaMusumeTournamentMaker.API.Application.Interfaces
{
    public interface ITournamentService
    {
        Task<List<TournamentDto>> GetAllTournamentsAsync();
        Task<TournamentDto> GetTournamentByIdAsync(int id);
        Task<TournamentDto> CreateTournamentAsync(CreateTournamentDto createTournamentDto);
        Task<PlayerDto> AddPlayerAsync(AddPlayerDto addPlayerDto);
        Task<int> RemovePlayerAsync(RemovePlayerDto removePlayerDto);
        Task<TournamentDto> StartTournamentAsync(StartTournamentDto startTournamentDto);
        Task<TournamentDto> StartNextRoundAsync(StartNextRoundDto startNextRoundDto);
        Task<TournamentDto> UpdateTournamentAsync(UpdateTournamentDto updateTournamentDto);
        Task<bool> DeleteTournamentAsync(DeleteTournamentDto deleteTournamentDto);
        Task ChallengePasswordAsync(ChallengePasswordDto challengePasswordDto);
    }
}