use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::program_error::ProgramError;
use anchor_lang::solana_program::sysvar::Sysvar; 

declare_id!("H3f8YJFN4zFEVsGdb4gnkYnnyKjLcu2HrHxtimcVDDfH");

#[program]
pub mod fund_sol {
    use super::*;

    pub fn create(ctx: Context<Create>, name: String, description: String) -> ProgramResult {
        let fundraiser = &mut ctx.accounts.fundraiser;
        fundraiser.name = name;
        fundraiser.description = description;
        fundraiser.amount_donated = 0;
        fundraiser.admin = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.fundraiser.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.fundraiser.to_account_info(),
            ],
        )?;
        ctx.accounts.fundraiser.amount_donated += amount;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        let fundraiser = &mut ctx.accounts.fundraiser;
        let admin = &mut ctx.accounts.admin;

        let rent_balance = Rent::get()?.minimum_balance(fundraiser.to_account_info().data_len());
        let amount_to_withdraw = **fundraiser.to_account_info().lamports.borrow() - rent_balance;

        if amount_to_withdraw <= 0 {
            return Err(ProgramError::InsufficientFunds);
        }
        
        **fundraiser.to_account_info().try_borrow_mut_lamports()? -= amount_to_withdraw;
        **admin.to_account_info().try_borrow_mut_lamports()? += amount_to_withdraw;

        fundraiser.amount_donated = 0;

        Ok(())
    }
}


#[derive(Accounts)]
pub struct Create<'info> {
    #[account(
        init, 
        payer = user, 
        space = 9000, 
        seeds = [b"fundraiser".as_ref(), user.key().as_ref()], 
        bump
    )] 
    pub fundraiser: Account<'info, Fundraiser>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub fundraiser: Account<'info, Fundraiser>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = admin)] 
    pub fundraiser: Account<'info, Fundraiser>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[account]
pub struct Fundraiser {
    pub name: String,
    pub description: String,
    pub amount_donated: u64,
    pub admin: Pubkey,
}
