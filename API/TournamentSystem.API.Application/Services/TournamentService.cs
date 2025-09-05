using Microsoft.EntityFrameworkCore;
using UmaMusumeTournamentMaker.API.Application.DTOs;
using UmaMusumeTournamentMaker.API.Application.Extensions;
using UmaMusumeTournamentMaker.API.Application.Interfaces;
using UmaMusumeTournamentMaker.API.Application.Strategies;
using UmaMusumeTournamentMaker.API.Domain.Entities;
using UmaMusumeTournamentMaker.API.Domain.Enums;

namespace UmaMusumeTournamentMaker.API.Application.Services
{
    public class TournamentService : ITournamentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITournamentStrategyFactory _strategyFactory;
        private readonly ITournamentMatchService _matchService;
        private readonly ITournamentLogger _logger;
        private readonly ICacheService _cacheService;

        public TournamentService(
            IUnitOfWork unitOfWork,
            ITournamentStrategyFactory strategyFactory,
            ITournamentMatchService matchService,
            ITournamentLogger logger,
            ICacheService cacheService)
        {
            _unitOfWork = unitOfWork;
            _strategyFactory = strategyFactory;
            _matchService = matchService;
            _logger = logger;
            _cacheService = cacheService;
        }

        public async Task<List<TournamentDto>> GetAllTournamentsAsync()
        {
            var tournaments = await _unitOfWork.Tournaments.GetAllAsync(); //No need to get or set cache here, simple light objects
            return tournaments.ToSimpleDto();
        }

        public async Task<TournamentDto> GetTournamentByIdAsync(int id)
        {
            var tournament = _cacheService.GetTournament(id) ?? await _unitOfWork.Tournaments.GetByIdWithCompleteDetailsAsync(id);
            if (tournament != null)
                _cacheService.SetTournament(tournament);
            else
                throw new ArgumentException("Tournament not found");


            return tournament.ToDto();
        }

        public async Task<TournamentDto> CreateTournamentAsync(CreateTournamentDto createTournamentDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();
                try
                {
                    var tournament = new Tournament
                    {
                        Name = createTournamentDto.Name,
                        Type = createTournamentDto.Type,
                        Status = TournamentStatus.Created,
                        Password = createTournamentDto.Password,
                        CreatedAt = DateTime.UtcNow,
                        CurrentRound = 0
                    };

                    var createdTournament = _unitOfWork.Tournaments.Create(tournament);
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.SetTournament(createdTournament);

                    return createdTournament.ToDto();
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to create tournament '{createTournamentDto.Name}': {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException($"An unexpected error occurred while creating the tournament '{createTournamentDto.Name}'. Please try again.", ex);
                }
            });
        }

        public async Task<PlayerDto> AddPlayerAsync(AddPlayerDto addPlayerDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(addPlayerDto.TournamentId, addPlayerDto.Password);

                    var tournament = _cacheService.GetTournament(addPlayerDto.TournamentId)
                        ?? await _unitOfWork.Tournaments.GetByIdAsync(addPlayerDto.TournamentId);

                    if (tournament!.Status != TournamentStatus.Created)
                        throw new InvalidOperationException("Cannot add players to a tournament that has already started");

                    if (await _unitOfWork.Players.ExistsInTournamentAsync(addPlayerDto.TournamentId, addPlayerDto.Name))
                        throw new InvalidOperationException($"Player '{addPlayerDto.Name}' already exists in this tournament");

                    var player = new Player
                    {
                        Name = addPlayerDto.Name,
                        TournamentId = addPlayerDto.TournamentId,
                        Wins = 0,
                        Losses = 0,
                        Points = 0,
                        RoundWins = 0,
                        RoundLosses = 0,
                        Group = string.Empty
                    };

                    var addedPlayer = _unitOfWork.Players.AddPlayer(player);
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.AddPlayerToTournament(addPlayerDto.TournamentId, addedPlayer);

                    return addedPlayer.ToDto();
                }
                catch (InvalidOperationException)
                {
                    throw; // Re-throw business logic exceptions as-is
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw; // Re-throw validation exceptions as-is
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to add player '{addPlayerDto.Name}' to tournament {addPlayerDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException($"An unexpected error occurred while adding player '{addPlayerDto.Name}' to the tournament. Please try again.", ex);
                }
            });

        }

        public async Task<int> RemovePlayerAsync(RemovePlayerDto removePlayerDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () => 
            { 
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(removePlayerDto.TournamentId, removePlayerDto.Password);

                    var tournament = _cacheService.GetTournament(removePlayerDto.TournamentId) 
                        ?? await _unitOfWork.Tournaments.GetByIdAsync(removePlayerDto.TournamentId);

                    if (tournament!.Status != TournamentStatus.Created)
                        throw new InvalidOperationException("Cannot remove players from a tournament that has already started");

                    var player = await _unitOfWork.Players.GetByIdAsync(removePlayerDto.PlayerId);
                    if (player == null || player.TournamentId != removePlayerDto.TournamentId)
                        throw new ArgumentException("Player not found in this tournament");

                    var playerId = player.Id;
                    _unitOfWork.Players.Remove(player);
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.RemovePlayerFromTournament(removePlayerDto.TournamentId, playerId);

                    return playerId;
                }
                catch (InvalidOperationException)
                {
                    throw; // Re-throw business logic exceptions as-is
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw; // Re-throw validation exceptions as-is
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to remove player {removePlayerDto.PlayerId} from tournament {removePlayerDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException($"An unexpected error occurred while removing the player from the tournament. Please try again.", ex);
                }
            });
        }

        public async Task<TournamentDto> StartTournamentAsync(StartTournamentDto startTournamentDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(startTournamentDto.TournamentId, startTournamentDto.Password);

                    var tournament = _cacheService.GetTournament(startTournamentDto.TournamentId)
                        ?? await _unitOfWork.Tournaments.GetByIdAsync(startTournamentDto.TournamentId);

                    if (tournament!.Status != TournamentStatus.Created)
                        throw new InvalidOperationException("Tournament has already been started");

                    if (tournament.Players.Count < 3)
                        throw new InvalidOperationException("Need at least 3 players to start a tournament");

                    tournament.Status = TournamentStatus.InProgress;
                    tournament.StartedAt = DateTime.UtcNow;

                    //// Generate matches for the first round using the appropriate strategy
                    var strategy = _strategyFactory.GetStrategy(tournament.Type);
                    await CreateRoundAsync(strategy, tournament);

                    await _unitOfWork.SaveChangesAsync();

                    // Get updated tournament for broadcasting BEFORE committing transaction
                    var updatedTournament = await _unitOfWork.Tournaments.GetByIdWithCompleteDetailsAsync(startTournamentDto.TournamentId);

                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.UpdateTournament(updatedTournament!);

                    return updatedTournament!.ToDto();
                }
                catch (InvalidOperationException)
                {
                    throw; // Re-throw business logic exceptions as-is
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw; // Re-throw validation exceptions as-is
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to start tournament {startTournamentDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException("An unexpected error occurred while starting the tournament. Please try again.", ex);
                }
            });
        }

        public async Task<TournamentDto> StartNextRoundAsync(StartNextRoundDto startNextRoundDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(startNextRoundDto.TournamentId, startNextRoundDto.Password);

                    var tournament = _cacheService.GetTournament(startNextRoundDto.TournamentId)
                        ?? await _unitOfWork.Tournaments.GetByIdAsync(startNextRoundDto.TournamentId);

                    if (tournament!.Status != TournamentStatus.InProgress)
                        throw new InvalidOperationException("Tournament is not in progress");

                    // Get current round
                    var currentRound = tournament.Rounds.FirstOrDefault(r => r.RoundNumber == tournament.CurrentRound);
                    if (currentRound == null)
                        throw new InvalidOperationException("Current round not found");

                    // Process all match winners for the current round
                    bool roundCompleted = _matchService.ProcessMatchWinners(currentRound, startNextRoundDto.MatchResults);

                    if (!roundCompleted)
                    {
                        throw new InvalidOperationException("Cannot advance to next round - not all matches in the current round have winners assigned");
                    }

                    // Save the completed round
                    await _unitOfWork.SaveChangesAsync();

                    // Check if tournament should be completed after this round
                    var strategy = _strategyFactory.GetStrategy(tournament.Type);
                    if (!IsTournamentCompleted(strategy, tournament, currentRound))
                    {
                        // Create next round and let the strategy determine its type and matches
                        await CreateRoundAsync(strategy, tournament, ++tournament.CurrentRound);
                    }

                    // Save tournament completion status if it was updated
                    await _unitOfWork.SaveChangesAsync();

                    // Get updated tournament for broadcasting BEFORE committing transaction
                    var updatedTournament = await _unitOfWork.Tournaments.GetByIdWithCompleteDetailsAsync(startNextRoundDto.TournamentId);

                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.UpdateTournament(updatedTournament!);

                    return updatedTournament!.ToDto();
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw; // Re-throw validation exceptions as-is
                }
                catch (InvalidOperationException)
                {
                    throw; // Re-throw business logic exceptions as-is
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to start next round for tournament {startNextRoundDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException("An unexpected error occurred while starting the next round. Please try again.", ex);
                }
            });
        }

        public async Task CreateRoundAsync(ITournamentStrategy strategy, Tournament tournament, int roundNumber = 1)
        {
            tournament.CurrentRound = roundNumber;
            var newRound = new Round
            {
                RoundNumber = tournament.CurrentRound,
                TournamentId = tournament.Id,
                CreatedAt = DateTime.UtcNow,
                IsCompleted = false,
                RoundType = "Regular" // Strategy will update this as needed
            };

            var createdRound = _unitOfWork.Rounds.Create(newRound);
            await _unitOfWork.SaveChangesAsync(); // Save to get database ID

            // Let the strategy decide what type of round this should be and create matches
            await strategy.CreateMatchesForRoundAsync(tournament, createdRound);
            _unitOfWork.Tournaments.Update(tournament);
        }

        public bool IsTournamentCompleted(ITournamentStrategy strategy, Tournament tournament, Round currentRound)
        {
            bool tournamentCompleted = strategy.ShouldCompleteTournament(tournament);

            if (tournamentCompleted)
            {
                _logger.LogTournamentCompletion(tournament.Id, tournament.CurrentRound, tournament.Type.ToString(), tournament.Players.Count);

                // Determine tournament winner
                var winnerId = strategy.DetermineTournamentWinner(tournament);
                tournament.WinnerId = winnerId;
                _logger.LogDebug("TournamentService", $"Tournament {tournament.Id} completed with winner: {winnerId}");

                // Mark tournament as completed
                tournament.Status = TournamentStatus.Completed;
                tournament.CompletedAt = DateTime.UtcNow;
                _unitOfWork.Tournaments.Update(tournament);
            }

            return tournamentCompleted;
        }

        public async Task<TournamentDto> UpdateTournamentAsync(UpdateTournamentDto updateTournamentDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(updateTournamentDto.TournamentId, updateTournamentDto.Password);

                    var tournament = _cacheService.GetTournament(updateTournamentDto.TournamentId)
                        ?? await _unitOfWork.Tournaments.GetByIdAsync(updateTournamentDto.TournamentId);

                    tournament!.Name = updateTournamentDto.Name;
                    _unitOfWork.Tournaments.Update(tournament);
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                    _cacheService.UpdateTournament(tournament);

                    return tournament.ToDto();
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw; // Re-throw validation exceptions as-is
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to update tournament {updateTournamentDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException("An unexpected error occurred while updating the tournament. Please try again.", ex);
                }
            });
        }

        public async Task<bool> DeleteTournamentAsync(DeleteTournamentDto deleteTournamentDto)
        {
            return await _unitOfWork.GetStrategy().ExecuteAsync(async () =>
            {
                using var transaction = await _unitOfWork.BeginTransactionAsync();

                try
                {
                    await ChallengePasswordAsync(deleteTournamentDto.TournamentId, deleteTournamentDto.Password);

                    var result = await _unitOfWork.Tournaments.DeleteAsync(deleteTournamentDto.TournamentId);
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                    if (result)
                        _cacheService.RemoveTournament(deleteTournamentDto.TournamentId);

                    return result;
                }
                catch (UnauthorizedAccessException)
                {
                    throw; // Re-throw authentication exceptions as-is
                }
                catch (ArgumentException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError("TournamentService", $"Failed to delete tournament {deleteTournamentDto.TournamentId}: {ex.Message}", ex);
                    await _unitOfWork.RollbackTransactionAsync();
                    throw new InvalidOperationException("An unexpected error occurred while deleting the tournament. Please try again.", ex);
                }
            });
        }

        public async Task ChallengePasswordAsync(int tournamentId, string password)
        {
            try
            {
                var tournament = _cacheService.GetTournament(tournamentId);
                if (tournament == null)
                {
                    tournament = await _unitOfWork.Tournaments.GetByIdAsync(tournamentId);
                    tournament.ValidatePassword(password);
                }
                else 
                    tournament.ValidatePassword(password);
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (ArgumentException)
            {
                // Tournament not found
                throw;
            }
        }

        public async Task ChallengePasswordAsync(ChallengePasswordDto challengePasswordDto)
        {
            try
            {
                await ChallengePasswordAsync(challengePasswordDto.TournamentId, challengePasswordDto.Password);
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (ArgumentException)
            {
                // Tournament not found
                throw;
            }
        }
    }
}