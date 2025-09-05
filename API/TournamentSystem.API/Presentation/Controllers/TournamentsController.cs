using Microsoft.AspNetCore.Mvc;
using UmaMusumeTournamentMaker.API.Application.DTOs;
using UmaMusumeTournamentMaker.API.Application.Interfaces;

namespace UmaMusumeTournamentMaker.API.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentsController : ControllerBase
    {
        private readonly ITournamentService _tournamentService;
        private readonly ITournamentBroadcastService _broadcastService;

        public TournamentsController(ITournamentService tournamentService, ITournamentBroadcastService broadcastService)
        {
            _tournamentService = tournamentService;
            _broadcastService = broadcastService;
        }

        [HttpGet]
        public async Task<ActionResult<List<TournamentDto>>> GetAllTournaments()
        {
            try
            {
                var tournaments = await _tournamentService.GetAllTournamentsAsync();
                return Ok(tournaments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TournamentDto>> GetTournament(int id)
        {
            try
            {
                var tournament = await _tournamentService.GetTournamentByIdAsync(id);
                if (tournament == null)
                    return NotFound(new { message = "Tournament not found" });

                return Ok(tournament);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<TournamentDto>> CreateTournament(CreateTournamentDto createTournamentDto)
        {
            try
            {
                var tournament = await _tournamentService.CreateTournamentAsync(createTournamentDto);
                return CreatedAtAction(nameof(GetTournament), new { id = tournament.Id }, tournament);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("players")]
        public async Task<ActionResult> AddPlayer(AddPlayerDto addPlayerDto)
        {
            try
            {
                var addedPlayer = await _tournamentService.AddPlayerAsync(addPlayerDto);
                await _broadcastService.BroadcastPlayerAdded(addPlayerDto.TournamentId, addedPlayer);
                return Ok(new { message = "Player added successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("players")]
        public async Task<ActionResult> RemovePlayer(RemovePlayerDto removePlayerDto)
        {
            try
            {
                var removedPlayerId = await _tournamentService.RemovePlayerAsync(removePlayerDto);
                await _broadcastService.BroadcastPlayerRemoved(removePlayerDto.TournamentId, removedPlayerId);
                return Ok(new { message = "Player removed successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("start")]
        public async Task<ActionResult> StartTournament(StartTournamentDto startTournamentDto)
        {
            try
            {
                var tournament = await _tournamentService.StartTournamentAsync(startTournamentDto);
                await _broadcastService.BroadcastTournamentStarted(tournament.Id, tournament);
                return Ok(new { message = "Tournament started successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("next-round")]
        public async Task<ActionResult> StartNextRound(StartNextRoundDto startNextRoundDto)
        {
            try
            {
                var tournament = await _tournamentService.StartNextRoundAsync(startNextRoundDto);
                await _broadcastService.BroadcastNewRound(tournament.Id, tournament);
                return Ok(new { message = "Next round started successfully" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<ActionResult> UpdateTournament(UpdateTournamentDto updateTournamentDto)
        {
            try
            {
                var tournament = await _tournamentService.UpdateTournamentAsync(updateTournamentDto);
                await _broadcastService.BroadcastTournamentUpdated(tournament.Id, tournament);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<ActionResult> DeleteTournament(DeleteTournamentDto deleteTournamentDto)
        {
            try
            {
                var result = await _tournamentService.DeleteTournamentAsync(deleteTournamentDto);
                if (!result)
                    return NotFound(new { message = "Tournament not found" });

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("validate-password")]
        public async Task<ActionResult> ValidatePassword(ChallengePasswordDto validatePasswordDto)
        {
            try
            {
                await _tournamentService.ChallengePasswordAsync(validatePasswordDto);
                return Ok(new { message = "Password is valid", isValid = true });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, isValid = false });
            }
        }
    }
}